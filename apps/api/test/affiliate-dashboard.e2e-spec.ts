import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import * as cookieParser from "cookie-parser";
import { PrismaService } from "../src/prisma/prisma.service";
import { Role, PlanType, BusinessStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

describe("AffiliateDashboard (e2e)", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let cookies: string[] = [];
  let _affiliateId: string;
  let businessId: string;

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
    
    // Cleanup - delete in order of dependencies
    await prismaService.commission.deleteMany({});
    await prismaService.business.deleteMany({});
    await prismaService.user.deleteMany({});

    const password = await bcrypt.hash("password123", 10);
    const user = await prismaService.user.create({
      data: {
        email: "dash@vemtap.com",
        fullName: "Dash User",
        phone: "9999999999",
        password,
        role: Role.AFFILIATE,
        referralCode: "DASH001",
      },
    });
    _affiliateId = user.id;

    // Create some data
    const biz = await prismaService.business.create({
      data: {
        businessName: "Test Business",
        ownerName: "Owner",
        email: "biz@test.com",
        phone: "111",
        planType: PlanType.BASIC,
        referralCode: "DASH001",
        affiliateId: user.id,
        status: BusinessStatus.ACTIVE,
        subscriptionAmount: 3000,
        commissionAmount: 450,
        commissionRate: 0.15,
      },
    });
    businessId = biz.id;

    const loginRes = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "dash@vemtap.com", password: "password123" });

    const setCookie = loginRes.headers["set-cookie"] as any;
    cookies = setCookie.map((c: string) => c.split(";")[0]);
  });

  afterAll(async () => {
    await prismaService.commission.deleteMany({});
    await prismaService.business.deleteMany({});
    await prismaService.user.deleteMany({});
    await app.close();
  });

  describe("Dashboard Endpoints", () => {
    it("/affiliate/dashboard/stats (GET)", async () => {
      const res = await request(app.getHttpServer())
        .get("/affiliate/dashboard/stats")
        .set("Cookie", cookies)
        .expect(200);

      expect(res.body).toHaveProperty("activeReferrals");
      expect(res.body.activeReferrals).toBe(1);
      expect(res.body).toHaveProperty("todayEarnings");
      expect(res.body).toHaveProperty("todayClicks");
      expect(res.body).toHaveProperty("currentLevel");
      expect(typeof res.body.todayEarnings).toBe("number");
      expect(typeof res.body.todayClicks).toBe("number");
      expect(typeof res.body.currentLevel).toBe("string");
      expect(res.body.currentLevel).toBe("Novice Affiliate"); // 0 referrals
    });

    it("/affiliate/dashboard/forecast (GET)", async () => {
      const res = await request(app.getHttpServer())
        .get("/affiliate/dashboard/forecast")
        .set("Cookie", cookies)
        .expect(200);

      expect(res.body.monthlyRecurringRevenue).toBe(450);
    });

    it("/affiliate/dashboard/charts (GET)", async () => {
      const res = await request(app.getHttpServer())
        .get("/affiliate/dashboard/charts")
        .set("Cookie", cookies)
        .expect(200);

      expect(res.body.earningsHistory.length).toBe(30);
    });
  });

  describe("Business Management", () => {
    it("/businesses/:id (PATCH)", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/businesses/${businessId}`)
        .set("Cookie", cookies)
        .send({ businessName: "Updated Business Name" })
        .expect(200);

      expect(res.body.businessName).toBe("Updated Business Name");
    });

    it("/businesses/:id/reminder (POST) - should send reminder", async () => {
      // First make it non-active
      await prismaService.business.update({
        where: { id: businessId },
        data: { status: BusinessStatus.TRIAL }
      });

      await request(app.getHttpServer())
        .post(`/businesses/${businessId}/reminder`)
        .set("Cookie", cookies)
        .expect(201);
    });

    it("/businesses/:id/reminder (POST) - should fail due to cooldown", async () => {
      const res = await request(app.getHttpServer())
        .post(`/businesses/${businessId}/reminder`)
        .set("Cookie", cookies)
        .expect(400);

      expect(res.body.message).toContain("wait 24 hours");
    });

    it("/businesses/export (GET)", async () => {
      const res = await request(app.getHttpServer())
        .get("/businesses/export")
        .set("Cookie", cookies)
        .expect(200)
        .expect("Content-Type", /text\/csv/);

      expect(res.text).toContain("Updated Business Name");
    });
  });
});
