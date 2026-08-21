import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import * as cookieParser from "cookie-parser";
import { PrismaService } from "../src/prisma/prisma.service";
import { Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { ResendService } from "../src/otp/resend.service";
import { PushService } from "../src/notifications/push.service";

describe("Communication System (e2e)", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let adminCookies: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ResendService)
      .useValue({ sendBroadcastEmail: jest.fn().mockResolvedValue(0) })
      .overrideProvider(PushService)
      .useValue({ broadcastPush: jest.fn().mockResolvedValue(true) })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);

    // Clean slate
    await prismaService.communicationMessage.deleteMany({});
    await prismaService.communicationTemplate.deleteMany({});
    await prismaService.lead.deleteMany({});
    await prismaService.user.deleteMany({});

    const password = await bcrypt.hash("password123", 10);
    await prismaService.user.create({
      data: {
        email: "admin@example.com",
        password,
        fullName: "Admin User",
        phone: "08011112222",
        referralCode: "ADM-001",
        role: Role.ADMIN,
        status: "ACTIVE",
      },
    });

    const loginResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "admin@example.com", password: "password123" });
    adminCookies = extractCookies(loginResponse);

    // Enable SMS for the suite. Disabled SMS is recorded as FAILED (never SENT),
    // so the SMS tests explicitly enable it using the (simulating) disabled provider.
    await request(app.getHttpServer())
      .patch("/communication/settings")
      .set("Cookie", adminCookies)
      .send({ smsEnabled: true, smsProvider: "disabled" });
  });

  function extractCookies(res: request.Response): string[] {
    const setCookie = (res.headers["set-cookie"] || []) as string | string[];
    const arr = Array.isArray(setCookie) ? setCookie : [setCookie];
    return arr.filter(Boolean).map((cookie: string) => cookie.split(";")[0]);
  }

  afterAll(async () => {
    await prismaService.customerJourneyStage.deleteMany({});
    await prismaService.communicationMessage.deleteMany({});
    await prismaService.communicationTemplate.deleteMany({});
    await prismaService.lead.deleteMany({});
    await prismaService.user.deleteMany({});
    await app.close();
  });

  async function createAgent() {
    const email = `agent-${Date.now()}@example.com`;
    const password = await bcrypt.hash("password123", 10);
    return prismaService.user.create({
      data: {
        email,
        password,
        fullName: "Field Agent",
        phone: `0802222${Math.floor(1000 + Math.random() * 9000)}`,
        referralCode: `AGT-${Date.now()}`,
        role: Role.AGENT,
        status: "ACTIVE",
      },
    });
  }

  async function loginAs(email: string): Promise<string[]> {
    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password: "password123" });
    return extractCookies(res);
  }

  async function createLead(status = "INTERESTED", userId?: string) {
    const user = userId ? await prismaService.user.findUnique({ where: { id: userId } }) : await createAgent();
    return prismaService.lead.create({
      data: {
        userId: user!.id,
        businessName: "ABC Restaurant",
        industry: "Restaurant",
        location: "Apo",
        phone: "08012345678",
        contactName: "John",
        source: "Direct Referral",
        status,
      },
    });
  }

  it("should create a template, preview audience, and start a WhatsApp queue", async () => {
    const lead = await createLead("INTERESTED");

    // Create a WhatsApp template
    const templateRes = await request(app.getHttpServer())
      .post("/communication/templates")
      .set("Cookie", adminCookies)
      .send({
        name: "Interested First Follow-up",
        channel: "WHATSAPP",
        body: "Hi [Business Name], thanks for your interest in VEMTAP.",
      });
    expect(templateRes.status).toBe(201);
    expect(templateRes.body.id).toBeDefined();

    // Audience preview should include the interested lead
    const previewRes = await request(app.getHttpServer())
      .get("/communication/audience/preview")
      .set("Cookie", adminCookies)
      .query("statuses[]=INTERESTED");
    expect(previewRes.status).toBe(200);
    expect(previewRes.body.total).toBeGreaterThanOrEqual(1);

    // Start a WhatsApp queue for the audience
    const sendRes = await request(app.getHttpServer())
      .post("/communication/messages")
      .set("Cookie", adminCookies)
      .send({
        channel: "WHATSAPP",
        body: "Hi [Business Name], thanks for your interest in VEMTAP.",
        audience: { statuses: ["INTERESTED"] },
        templateId: templateRes.body.id,
      });
    expect(sendRes.status).toBe(201);
    expect(Array.isArray(sendRes.body)).toBe(true);
    expect(sendRes.body.length).toBeGreaterThanOrEqual(1);
    expect(sendRes.body[0].id).toBeDefined();
    expect(sendRes.body[0].status).toBe("PENDING");

    // The queue should expose the message with a deep link
    const queueRes = await request(app.getHttpServer())
      .get("/communication/whatsapp/queue")
      .set("Cookie", adminCookies);
    expect(queueRes.status).toBe(200);
    expect(queueRes.body.length).toBeGreaterThanOrEqual(1);
    const item = queueRes.body[0];
    expect(item.deepLink).toContain("https://wa.me/");
    expect(item.deepLink).toContain("ABC%20Restaurant");

    // Mark the message as sent
    const markRes = await request(app.getHttpServer())
      .post(`/communication/whatsapp/${item.id}/mark-sent`)
      .set("Cookie", adminCookies);
    expect(markRes.status).toBe(200);
    expect(markRes.body.success).toBe(true);

    const stored = await prismaService.communicationMessage.findUnique({ where: { id: item.id } });
    expect(stored!.status).toBe("SENT");
    expect(stored!.markedSentAt).toBeDefined();

    const updatedLead = await prismaService.lead.findUnique({ where: { id: lead.id } });
    expect(updatedLead!.lastContactedAt).toBeDefined();
  });

  it("should send an SMS via the disabled provider", async () => {
    const lead = await createLead("INTERESTED");

    const res = await request(app.getHttpServer())
      .post("/communication/messages")
      .set("Cookie", adminCookies)
      .send({
        channel: "SMS",
        body: "Hi, thanks for your interest in VEMTAP.",
        leadIds: [lead.id],
      });
    expect(res.status).toBe(201);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].leadId).toBe(lead.id);
    expect(res.body[0].status).toBe("SENT");
  });

  it("should reject an SMS over 160 characters", async () => {
    const lead = await createLead("INTERESTED");
    const res = await request(app.getHttpServer())
      .post("/communication/messages")
      .set("Cookie", adminCookies)
      .send({
        channel: "SMS",
        body: "x".repeat(200),
        leadIds: [lead.id],
      });
    expect(res.status).toBe(400);
  });

  it("should expose overview and reporting for admin", async () => {
    const overview = await request(app.getHttpServer())
      .get("/communication/overview")
      .set("Cookie", adminCookies);
    expect(overview.status).toBe(200);
    expect(overview.body.overview).toBeDefined();
    expect(overview.body.overview.totalContacts).toBeGreaterThanOrEqual(0);

    const reporting = await request(app.getHttpServer())
      .get("/communication/reporting")
      .set("Cookie", adminCookies);
    expect(reporting.status).toBe(200);
    expect(reporting.body.conversion).toBeDefined();
  });

  it("should prevent a salesperson from reading another agent's contact history (IDOR)", async () => {
    // Agent A owns a lead with a pending WhatsApp follow-up.
    const agentA = await createAgent();
    const leadA = await createLead("INTERESTED", agentA.id);

    await request(app.getHttpServer())
      .post("/communication/messages")
      .set("Cookie", adminCookies)
      .send({
        channel: "WHATSAPP",
        body: "Hi, thanks for your interest in VEMTAP.",
        leadIds: [leadA.id],
      })
      .expect(201);

    // Agent B (different user) must not read Agent A's contact profile.
    const agentB = await createAgent();
    const agentBCookies = await loginAs(agentB.email);

    const profileRes = await request(app.getHttpServer())
      .get(`/communication/messages/contacts/${leadA.id}`)
      .set("Cookie", agentBCookies);
    expect(profileRes.status).toBe(403);

    // Agent B must not see Agent A's pending WhatsApp in their own queue.
    const queueRes = await request(app.getHttpServer())
      .get("/communication/whatsapp/queue")
      .set("Cookie", agentBCookies);
    expect(queueRes.status).toBe(200);
    const includesOtherLead = queueRes.body.some(
      (m: { leadId: string }) => m.leadId === leadA.id,
    );
    expect(includesOtherLead).toBe(false);
  });

  it("should NOT mark an SMS as SENT while SMS is disabled", async () => {
    // Disable SMS for this test
    await request(app.getHttpServer())
      .patch("/communication/settings")
      .set("Cookie", adminCookies)
      .send({ smsEnabled: false, smsProvider: "disabled" });

    const lead = await createLead("INTERESTED");
    const res = await request(app.getHttpServer())
      .post("/communication/messages")
      .set("Cookie", adminCookies)
      .send({
        channel: "SMS",
        body: "Hi, thanks for your interest in VEMTAP.",
        leadIds: [lead.id],
      });
    expect(res.status).toBe(201);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].status).toBe("FAILED");

    const stored = await prismaService.communicationMessage.findUnique({
      where: { id: res.body[0].id },
    });
    expect(stored!.status).toBe("FAILED");
    expect(stored!.failureReason).toBe("SMS is disabled");

    // Re-enable SMS for the rest of the suite
    await request(app.getHttpServer())
      .patch("/communication/settings")
      .set("Cookie", adminCookies)
      .send({ smsEnabled: true, smsProvider: "disabled" });
  });

  it("should prevent a salesperson from reading another agent's SMS history (IDOR)", async () => {
    const agentA = await createAgent();
    const leadA = await createLead("INTERESTED", agentA.id);

    await request(app.getHttpServer())
      .post("/communication/messages")
      .set("Cookie", adminCookies)
      .send({
        channel: "SMS",
        body: "Hi, thanks for your interest in VEMTAP.",
        leadIds: [leadA.id],
      })
      .expect(201);

    const agentB = await createAgent();
    const agentBCookies = await loginAs(agentB.email);

    const smsRes = await request(app.getHttpServer())
      .get("/communication/sms")
      .set("Cookie", agentBCookies);
    expect(smsRes.status).toBe(200);
    const includesOtherLead = (smsRes.body.data ?? []).some(
      (m: { leadId: string }) => m.leadId === leadA.id,
    );
    expect(includesOtherLead).toBe(false);
  });

  it("should enforce blacklisted words configuration on templates and SMS sending", async () => {
    // 1. Admin configures blacklisted words
    const settingsRes = await request(app.getHttpServer())
      .patch("/communication/settings")
      .set("Cookie", adminCookies)
      .send({
        smsBlacklistedWords: ["prohibited", "scam_offer"],
      });
    expect(settingsRes.status).toBe(200);
    expect(settingsRes.body.smsBlacklistedWords).toEqual(["prohibited", "scam_offer"]);

    // 2. Reject template creation if it contains a blacklisted word
    const templateRes = await request(app.getHttpServer())
      .post("/communication/templates")
      .set("Cookie", adminCookies)
      .send({
        name: "Prohibited Template",
        channel: "SMS",
        body: "Check out this prohibited deal",
      });
    expect(templateRes.status).toBe(400);

    // 3. Reject SMS message creation if it contains a blacklisted word
    const lead = await createLead("INTERESTED");
    const msgRes = await request(app.getHttpServer())
      .post("/communication/messages")
      .set("Cookie", adminCookies)
      .send({
        channel: "SMS",
        body: "Get our special scam_offer right now",
        leadIds: [lead.id],
      });
    expect(msgRes.status).toBe(400);

    // 4. Any authenticated user (e.g. Sales Agent) can fetch the blacklisted words list
    const agent = await createAgent();
    const agentCookies = await loginAs(agent.email);
    const agentBlacklistRes = await request(app.getHttpServer())
      .get("/communication/settings/blacklisted-words")
      .set("Cookie", agentCookies);
    expect(agentBlacklistRes.status).toBe(200);
    expect(agentBlacklistRes.body.blacklistedWords).toEqual(["prohibited", "scam_offer"]);

    // 5. Templates query also exposes blacklisted words to agents
    const templatesRes = await request(app.getHttpServer())
      .get("/communication/templates")
      .set("Cookie", agentCookies);
    expect(templatesRes.status).toBe(200);
    expect(templatesRes.body.smsBlacklistedWords).toEqual(["prohibited", "scam_offer"]);
  });

  it("should manage the customer journey stages (GET/PUT) with role enforcement", async () => {
    // PUT (admin) replaces all stages and returns the new ordered array.
    const putRes = await request(app.getHttpServer())
      .put("/communication/journey")
      .set("Cookie", adminCookies)
      .send({
        stages: [
          { name: "Welcome", waitDays: 0, channel: "SMS", enabled: true },
          { name: "Day 3 Follow-up", waitDays: 3, channel: "WHATSAPP", enabled: true },
        ],
      });
    expect(putRes.status).toBe(200);
    expect(Array.isArray(putRes.body)).toBe(true);
    expect(putRes.body).toHaveLength(2);
    expect(putRes.body[0].name).toBe("Welcome");
    expect(putRes.body[1].waitDays).toBe(3);

    // GET returns the persisted stages in execution order.
    const getRes = await request(app.getHttpServer())
      .get("/communication/journey")
      .set("Cookie", adminCookies);
    expect(getRes.status).toBe(200);
    expect(Array.isArray(getRes.body)).toBe(true);
    expect(getRes.body.map((s: any) => s.name)).toEqual(["Welcome", "Day 3 Follow-up"]);

    // GET is readable by any authenticated role (e.g. a sales agent).
    const agent = await createAgent();
    const agentCookies = await loginAs(agent.email);
    const agentGetRes = await request(app.getHttpServer())
      .get("/communication/journey")
      .set("Cookie", agentCookies);
    expect(agentGetRes.status).toBe(200);

    // PUT is admin-only — a sales agent is forbidden.
    const agentPutRes = await request(app.getHttpServer())
      .put("/communication/journey")
      .set("Cookie", agentCookies)
      .send({ stages: [] });
    expect(agentPutRes.status).toBe(403);

    // A non-existent templateId is rejected with 404 (no FK 500).
    const badTplRes = await request(app.getHttpServer())
      .put("/communication/journey")
      .set("Cookie", adminCookies)
      .send({
        stages: [
          { name: "Broken", waitDays: 0, channel: "SMS", templateId: "00000000-0000-0000-0000-000000000000", enabled: true },
        ],
      });
    expect(badTplRes.status).toBe(404);

    // An empty stage list clears the journey.
    const clearRes = await request(app.getHttpServer())
      .put("/communication/journey")
      .set("Cookie", adminCookies)
      .send({ stages: [] });
    expect(clearRes.status).toBe(200);
    expect(clearRes.body).toEqual([]);
  });
});


