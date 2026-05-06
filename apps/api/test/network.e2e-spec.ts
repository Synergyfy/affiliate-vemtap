import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import * as cookieParser from "cookie-parser";
import { PrismaService } from "../src/prisma/prisma.service";
import { Role, PlanType } from "@prisma/client";
import * as bcrypt from "bcryptjs";

describe("NetworkController (e2e)", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let cookies: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
    await prismaService.commission.deleteMany({});
    await prismaService.business.deleteMany({});
    await prismaService.user.deleteMany({});

    const password = await bcrypt.hash("password123", 10);

    // Create Manager
    const manager = await prismaService.user.create({
      data: {
        email: "manager@vemtap.com",
        fullName: "Manager User",
        phone: "111",
        password,
        role: Role.AFFILIATE,
        referralCode: "MGR001",
      },
    });

    // Create Recruit
    const recruit = await prismaService.user.create({
      data: {
        email: "recruit@vemtap.com",
        fullName: "Recruit User",
        phone: "222",
        password,
        role: Role.AFFILIATE,
        referralCode: "REC001",
        referrerId: manager.id,
      },
    });

    // Create business for recruit
    await prismaService.business.create({
      data: {
        businessName: "Recruit Biz",
        ownerName: "Owner",
        email: "rb@test.com",
        phone: "0",
        planType: PlanType.BASIC,
        referralCode: "REC001",
        affiliateId: recruit.id,
        subscriptionAmount: 3000,
      },
    });

    const loginRes = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "manager@vemtap.com", password: "password123" });

    const setCookie = loginRes.headers["set-cookie"] as any;
    cookies = setCookie.map((c: string) => c.split(";")[0]);
  });

  afterAll(async () => {
    await prismaService.commission.deleteMany({});
    await prismaService.business.deleteMany({});
    await prismaService.user.deleteMany({});
    await app.close();
  });

  it("/network/recruits (GET) - should list direct recruits", async () => {
    const res = await request(app.getHttpServer())
      .get("/network/recruits")
      .set("Cookie", cookies)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBeTruthy();
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].fullName).toBe("Recruit User");
    expect(res.body.data[0].businessCount).toBe(1);
  });

  it("/network/stats (GET) - should return milestone stats", async () => {
    const res = await request(app.getHttpServer())
      .get("/network/stats")
      .set("Cookie", cookies)
      .expect(200);

    expect(res.body.activeAgentsCount).toBe(1);
    expect(res.body.totalNetworkBusinesses).toBe(1);
    expect(res.body.milestones.agents.target).toBe(30);
  });

  it("/network/claim-bonus (POST) - should fail if not qualified", async () => {
    await request(app.getHttpServer())
      .post("/network/claim-bonus")
      .set("Cookie", cookies)
      .send({ type: "AGENT" })
      .expect(400);
  });

  it("/network/toggle-manager-mode (POST) - should fail if not qualified", async () => {
    await request(app.getHttpServer())
      .post("/network/toggle-manager-mode")
      .set("Cookie", cookies)
      .expect(400);
  });

  it("should successfully claim bonus and toggle manager mode when qualified", async () => {
    const manager = await prismaService.user.findUnique({ where: { email: "manager@vemtap.com" } });
    if (!manager) throw new Error("Manager not found");

    const recruit = await prismaService.user.findUnique({ where: { email: "recruit@vemtap.com" } });
    if (!recruit) throw new Error("Recruit not found");
    
    // Create 30 active agents
    for (let i = 0; i < 30; i++) {
      const u = await prismaService.user.create({
        data: {
          email: `agent${i}@test.com`,
          fullName: `Agent ${i}`,
          phone: `agent${i}`,
          password: "pw",
          referralCode: `AGENT${i}`,
          referrerId: manager.id,
        }
      });
      await prismaService.business.create({
        data: {
          businessName: `Biz ${i}`,
          ownerName: "Owner",
          email: `biz${i}@test.com`,
          phone: "0",
          planType: PlanType.BASIC,
          referralCode: `AGENT${i}`,
          affiliateId: u.id,
          subscriptionAmount: 3000,
          status: 'ACTIVE'
        }
      });
    }

    // Create 70 more businesses (total 100+)
    for (let i = 30; i < 100; i++) {
      await prismaService.business.create({
        data: {
          businessName: `Extra Biz ${i}`,
          ownerName: "Owner",
          email: `ebiz${i}@test.com`,
          phone: "0",
          planType: PlanType.BASIC,
          referralCode: "REC001",
          affiliateId: recruit.id,
          subscriptionAmount: 3000,
          status: 'ACTIVE'
        }
      });
    }

    // Now claim agent bonus
    const claimRes = await request(app.getHttpServer())
      .post("/network/claim-bonus")
      .set("Cookie", cookies)
      .send({ type: "AGENT" })
      .expect(201);
    
    expect(claimRes.body.success).toBe(true);
    expect(claimRes.body.amount).toBe(5000);

    // Toggle manager mode
    const toggleRes = await request(app.getHttpServer())
      .post("/network/toggle-manager-mode")
      .set("Cookie", cookies)
      .expect(201);
    
    expect(toggleRes.body.isManagerMode).toBe(true);
    expect(toggleRes.body.expiry).toBeDefined();

    // Verify stats
    const statsRes = await request(app.getHttpServer())
      .get("/network/stats")
      .set("Cookie", cookies)
      .expect(200);
    
    expect(statsRes.body.isManagerMode).toBe(true);
    expect(statsRes.body.hasClaimedAgentBonus).toBe(true);
  });
});
