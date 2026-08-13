import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import * as cookieParser from "cookie-parser";
import * as bcrypt from "bcryptjs";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { Role, UserStatus, PlanType } from "@prisma/client";

/**
 * End-to-end coverage for the unified Leads -> Visits -> Conversions funnel:
 *  - every business added via the market-mapping pipeline is a Lead
 *  - a Lead becomes a "visit" when it is marked visited (visitedAt set)
 *  - a successful Vemtap referral is a "conversion" (ACTIVE Business with a real amount)
 */
describe("Leads -> Visits -> Conversions funnel (e2e)", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let affiliateCookies: string[] = [];
  let adminCookies: string[] = [];
  let otherAffiliateCookies: string[] = [];
  let affiliateId: string;
  let rawApiKey: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);

    // Cleanup in dependency order
    await prismaService.commission.deleteMany({});
    await prismaService.business.deleteMany({});
    await prismaService.lead.deleteMany({});
    await prismaService.apiKey.deleteMany({});
    await prismaService.user.deleteMany({});
    await prismaService.platformSettings.deleteMany({});

    await prismaService.platformSettings.create({
      data: {
        directCommissionRate: 0.15,
        indirectCommissionRate: 0.05,
        minWithdrawal: 5000,
        withdrawalFee: 100,
        subAffiliateUnlockCount: 5,
        fraudThresholdScore: 80,
        referralUnlockCount: 0,
        earningDurationMonths: 12,
      },
    });

    const password = await bcrypt.hash("password123", 10);

    const affiliate = await prismaService.user.create({
      data: {
        email: "funnel-affiliate@vemtap.com",
        fullName: "Funnel Affiliate",
        phone: "7000000101",
        password,
        role: Role.AFFILIATE,
        referralCode: "FUNNEL01",
        status: UserStatus.ACTIVE,
      },
    });
    affiliateId = affiliate.id;

    const admin = await prismaService.user.create({
      data: {
        email: "funnel-admin@vemtap.com",
        fullName: "Funnel Admin",
        phone: "7000000102",
        password,
        role: Role.ADMIN,
        referralCode: "FUNNELAD",
      },
    });

    await prismaService.user.create({
      data: {
        email: "funnel-other@vemtap.com",
        fullName: "Other Affiliate",
        phone: "7000000103",
        password,
        role: Role.AFFILIATE,
        referralCode: "FUNNEL02",
        status: UserStatus.ACTIVE,
      },
    });

    // Create a mock Vemtap API key for the conversion flow
    const prefixId = "3774d66b";
    const secret = "a1ac7392c877d121bb3c919b65df2c9d11b66555f2e4efe6";
    rawApiKey = `vem_${prefixId}${secret}`;
    const keyHash = await bcrypt.hash(rawApiKey, 10);
    await prismaService.apiKey.create({
      data: {
        name: "Vemtap Integration Key",
        keyHash,
        prefix: `vem_${prefixId}`,
        createdById: admin.id,
      },
    });

    const affiliateLogin = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "funnel-affiliate@vemtap.com", password: "password123" })
      .expect(200);
    const affiliateSetCookie = affiliateLogin.headers["set-cookie"] as any;
    affiliateCookies = affiliateSetCookie.map((c: string) => c.split(";")[0]);

    const adminLogin = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "funnel-admin@vemtap.com", password: "password123" })
      .expect(200);
    const adminSetCookie = adminLogin.headers["set-cookie"] as any;
    adminCookies = adminSetCookie.map((c: string) => c.split(";")[0]);

    const otherAffiliateLogin = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "funnel-other@vemtap.com", password: "password123" })
      .expect(200);
    const otherSetCookie = otherAffiliateLogin.headers["set-cookie"] as any;
    otherAffiliateCookies = otherSetCookie.map((c: string) => c.split(";")[0]);
  });

  afterAll(async () => {
    await prismaService.commission.deleteMany({});
    await prismaService.business.deleteMany({});
    await prismaService.lead.deleteMany({});
    await prismaService.apiKey.deleteMany({});
    await prismaService.user.deleteMany({});
    await prismaService.platformSettings.deleteMany({});
    await app.close();
  });

  it("POST /market-mapping/visits adds a lead (pipeline business) to the leads table", async () => {
    const res = await request(app.getHttpServer())
      .post("/market-mapping/visits")
      .set("Cookie", affiliateCookies)
      .send({
        businessName: "Funnel Corner Store",
        industry: "Retail / Clothing",
        phone: "08055551001",
        contactName: "Owner One",
        status: "NOT_YET",
      })
      .expect(201);

    expect(res.body).toHaveProperty("id");
    expect(res.body.businessName).toBe("Funnel Corner Store");
    expect(res.body.status).toBe("NOT_YET");
    expect(res.body.visited).toBe(false);

    const lead = await prismaService.lead.findUnique({ where: { id: res.body.id } });
    expect(lead).toBeTruthy();
    expect(lead!.userId).toBe(affiliateId);
    expect(lead!.visitedAt).toBeNull();
  });

  it("GET /leads/me lists the pipeline business as a lead", async () => {
    const res = await request(app.getHttpServer())
      .get("/leads/me")
      .set("Cookie", affiliateCookies)
      .expect(200);

    const found = res.body.data.find((l: any) => l.businessName === "Funnel Corner Store");
    expect(found).toBeTruthy();
    expect(found.visited).toBe(false);
    expect(found.status).toBe("NOT_YET");
  });

  it("PATCH /market-mapping/visits/:id to INTERESTED marks the lead as visited", async () => {
    const lead = await prismaService.lead.findFirst({
      where: { userId: affiliateId, businessName: "Funnel Corner Store" },
    });
    expect(lead).toBeTruthy();

    const updated = await request(app.getHttpServer())
      .patch(`/market-mapping/visits/${lead!.id}`)
      .set("Cookie", affiliateCookies)
      .send({ status: "INTERESTED" })
      .expect(200);

    expect(updated.body.status).toBe("INTERESTED");
    expect(updated.body.visited).toBe(true);
    expect(updated.body.visitedAt).toBeTruthy();

    const reloaded = await prismaService.lead.findUnique({ where: { id: lead!.id } });
    expect(reloaded!.visitedAt).toBeTruthy();
  });

  it("GET /affiliate/dashboard/stats counts leads and visits from the unified table", async () => {
    const res = await request(app.getHttpServer())
      .get("/affiliate/dashboard/stats")
      .set("Cookie", affiliateCookies)
      .expect(200);

    expect(res.body.todayLeadsCount).toBeGreaterThanOrEqual(1);
    expect(res.body.todayVisitsCount).toBeGreaterThanOrEqual(1);
    expect(res.body.todayBusinessesAdded).toBe(res.body.todayLeadsCount);
  });

  it("GET /users/:id/leads (admin) returns non-overlapping leads/visits/businesses", async () => {
    const res = await request(app.getHttpServer())
      .get(`/users/${affiliateId}/leads`)
      .set("Cookie", adminCookies)
      .expect(200);

    expect(res.body.stats.totalLeads).toBeGreaterThanOrEqual(1);
    // The visited lead counts as a visit too
    expect(res.body.stats.totalVisits).toBeGreaterThanOrEqual(1);

    const linked = res.body.leads.find((l: any) => l.businessName === "Funnel Corner Store");
    expect(linked).toBeTruthy();
    const visit = res.body.visits.find((v: any) => v.businessName === "Funnel Corner Store");
    expect(visit).toBeTruthy();
  });

  it("a successful Vemtap referral is counted as a conversion in dashboard stats", async () => {
    const before = await request(app.getHttpServer())
      .get("/affiliate/dashboard/stats")
      .set("Cookie", affiliateCookies)
      .expect(200);
    const conversionsBefore = before.body.todayConversions ?? 0;

    await request(app.getHttpServer())
      .post("/external/businesses/attach")
      .set("x-api-key", rawApiKey)
      .send({
        affiliateId,
        businessName: "Converted Ventures Ltd",
        ownerName: "Converted Owner",
        email: "converted@ventures.com",
        phone: "+2348098765001",
        amount: 10000,
        planType: PlanType.PROFESSIONAL,
        address: "456 Corporate Boulevard, Lagos",
        businessType: "Technology",
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get("/affiliate/dashboard/stats")
      .set("Cookie", affiliateCookies)
      .expect(200);

    expect(res.body.todayConversions).toBeGreaterThan(conversionsBefore);
    expect(res.body.monthlyConversionsCount).toBeGreaterThan(0);
  });

  it("supports the visited filter on GET /leads/me", async () => {
    const visitedRes = await request(app.getHttpServer())
      .get("/leads/me")
      .query({ visited: "true" })
      .set("Cookie", affiliateCookies)
      .expect(200);

    const found = visitedRes.body.data.find((l: any) => l.businessName === "Funnel Corner Store");
    expect(found).toBeTruthy();
    expect(found.visited).toBe(true);
    expect(found.visitedAt).toBeTruthy();

    const notVisitedRes = await request(app.getHttpServer())
      .get("/leads/me")
      .query({ visited: "false" })
      .set("Cookie", affiliateCookies)
      .expect(200);

    const missing = notVisitedRes.body.data.find((l: any) => l.businessName === "Funnel Corner Store");
    expect(missing).toBeUndefined();
  });

  it("exposes weeklyLeadsCount and monthlyLeadsCount in affiliate stats", async () => {
    const res = await request(app.getHttpServer())
      .get("/affiliate/dashboard/stats")
      .set("Cookie", affiliateCookies)
      .expect(200);

    expect(res.body.weeklyLeadsCount).toBeGreaterThanOrEqual(1);
    expect(res.body.monthlyLeadsCount).toBeGreaterThanOrEqual(1);
  });

  it("accepts the legacy POTENTIAL status on POST /leads and stores it as NOT_YET", async () => {
    const res = await request(app.getHttpServer())
      .post("/leads")
      .set("Cookie", affiliateCookies)
      .send({ businessName: "Legacy Shop", phone: "08055551002", status: "POTENTIAL" })
      .expect(201);

    expect(res.body.status).toBe("NOT_YET");
    expect(res.body.visited).toBe(false);

    const stored = await prismaService.lead.findUnique({ where: { id: res.body.id } });
    expect(stored!.status).toBe("NOT_YET");
    expect(stored!.visitedAt).toBeNull();
  });

  it("rejects a non-owner updating someone else's lead with 403", async () => {
    const lead = await prismaService.lead.findFirst({
      where: { userId: affiliateId, businessName: "Funnel Corner Store" },
    });
    expect(lead).toBeTruthy();

    await request(app.getHttpServer())
      .patch(`/leads/${lead!.id}`)
      .set("Cookie", otherAffiliateCookies)
      .send({ status: "INTERESTED" })
      .expect(403);
  });
});
