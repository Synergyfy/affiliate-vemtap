import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import * as cookieParser from "cookie-parser";
import { PrismaService } from "../src/prisma/prisma.service";
import { Role, FraudStatus, NotificationType } from "@prisma/client";
import * as bcrypt from "bcryptjs";

describe("Admin Backend (e2e)", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let adminCookies: string[] = [];
  let affiliateCookies: string[] = [];

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

    // Cleanup before tests
    await prismaService.fraudAlert.deleteMany({});
    await prismaService.user.deleteMany({ where: { email: { contains: 'test.com' } } });

    // Setup test users
    const password = await bcrypt.hash("password123", 10);

    // Admin User
    const admin = await prismaService.user.upsert({
      where: { email: "admin@test.com" },
      update: {},
      create: {
        email: "admin@test.com",
        fullName: "Admin User",
        phone: "admin-phone",
        password,
        role: Role.ADMIN,
        referralCode: "ADMIN01",
      },
    });

    // Affiliate User
    const affiliate = await prismaService.user.upsert({
      where: { email: "affiliate@test.com" },
      update: {},
      create: {
        email: "affiliate@test.com",
        fullName: "Affiliate User",
        phone: "affiliate-phone",
        password,
        role: Role.AFFILIATE,
        referralCode: "AFF01",
      },
    });

    // Login Admin
    const adminLogin = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "admin@test.com", password: "password123" });
    adminCookies = (adminLogin.headers["set-cookie"] as any).map(
      (c: string) => c.split(";")[0],
    );

    // Login Affiliate
    const affiliateLogin = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "affiliate@test.com", password: "password123" });
    affiliateCookies = (affiliateLogin.headers["set-cookie"] as any).map(
      (c: string) => c.split(";")[0],
    );
  });

  afterAll(async () => {
    // Reset settings to defaults to avoid impacting other tests
    await prismaService.platformSettings.updateMany({
      data: {
        directCommissionRate: 0.15,
        indirectCommissionRate: 0.05,
        minWithdrawal: 5000,
        withdrawalFee: 100,
        subAffiliateUnlockCount: 5,
        fraudThresholdScore: 80,
        earningDurationMonths: 12,
      },
    });

    // Final cleanup
    await prismaService.fraudAlert.deleteMany({});
    await prismaService.user.deleteMany({ where: { email: { contains: 'test.com' } } });

    await app.close();
  });

  describe("DashboardController", () => {
    it("/admin/dashboard/stats (GET) - should return stats for admin", async () => {
      const res = await request(app.getHttpServer())
        .get("/admin/dashboard/stats")
        .set("Cookie", adminCookies)
        .expect(200);

      expect(res.body).toHaveProperty("totalAffiliates");
      expect(res.body).toHaveProperty("activeAffiliates");
      expect(res.body).toHaveProperty("commissionsTrendPercentage");
    });

    it("/admin/dashboard/stats (GET) - should block affiliate", async () => {
      await request(app.getHttpServer())
        .get("/admin/dashboard/stats")
        .set("Cookie", affiliateCookies)
        .expect(403);
    });
  });

  describe("FraudController", () => {
    it("/fraud (GET) - should list fraud alerts", async () => {
      await request(app.getHttpServer())
        .get("/fraud")
        .set("Cookie", adminCookies)
        .expect(200);
    });

    it("/fraud/:id/status (PATCH) - should update fraud alert status", async () => {
      // Create a dummy fraud alert first
      const alert = await prismaService.fraudAlert.create({
        data: {
          userId: "some-user-id",
          type: "SELF_REFERRAL",
          severity: "HIGH",
          description: "Test fraud",
        },
      });

      const res = await request(app.getHttpServer())
        .patch(`/fraud/${alert.id}/status`)
        .set("Cookie", adminCookies)
        .send({ status: FraudStatus.RESOLVED, resolution: "Fixed" })
        .expect(200);

      expect(res.body.status).toBe(FraudStatus.RESOLVED);
      expect(res.body.resolution).toBe("Fixed");
    });

    it("/fraud/:id/status (PATCH) - should automatically suspend user for CRITICAL fraud", async () => {
      const suspect = await prismaService.user.create({
        data: {
          email: `suspect-${Date.now()}@test.com`,
          fullName: "Suspect User",
          phone: `suspect-phone-${Date.now()}`,
          password: "password123",
          role: Role.AFFILIATE,
          referralCode: `SUSPECT-${Date.now()}`,
        },
      });

      const alert = await prismaService.fraudAlert.create({
        data: {
          userId: suspect.id,
          type: "MULTIPLE_ACCOUNTS",
          severity: "CRITICAL",
          description: "Critical fraud",
        },
      });

      await request(app.getHttpServer())
        .patch(`/fraud/${alert.id}/status`)
        .set("Cookie", adminCookies)
        .send({ status: FraudStatus.CONFIRMED, resolution: "Confirmed critical" })
        .expect(200);

      const updatedUser = await prismaService.user.findUnique({ where: { id: suspect.id } });
      expect(updatedUser?.status).toBe("SUSPENDED");
    });
  });

  describe("SettingsController", () => {
    it("/settings (GET) - should return platform settings", async () => {
      const res = await request(app.getHttpServer())
        .get("/settings")
        .set("Cookie", adminCookies)
        .expect(200);

      expect(res.body).toHaveProperty("directCommissionRate");
    });

    it("/settings (PATCH) - should update platform settings", async () => {
      const res = await request(app.getHttpServer())
        .patch("/settings")
        .set("Cookie", adminCookies)
        .send({ directCommissionRate: 0.2, earningDurationMonths: 24 })
        .expect(200);

      expect(Number(res.body.directCommissionRate)).toBe(0.2);
      expect(res.body.earningDurationMonths).toBe(24);
    });
  });

  describe("UsersController", () => {
    it("/users/export (GET) - should export users as CSV", async () => {
      const res = await request(app.getHttpServer())
        .get("/users/export")
        .set("Cookie", adminCookies)
        .expect(200);

      expect(res.header["content-type"]).toContain("text/csv");
      expect(res.header["content-disposition"]).toContain("attachment; filename=users.csv");
      expect(res.text).toContain("ID,Email,Full Name,Phone,Role,Status,KYC Status,Tier,Total Earnings,Created At");
    });
  });

  describe("NotificationsController", () => {
    it("/notifications/broadcast (POST) - should broadcast notification with filtering and channels", async () => {
      const res = await request(app.getHttpServer())
        .post("/notifications/broadcast")
        .set("Cookie", adminCookies)
        .send({
          type: NotificationType.SYSTEM,
          title: "Broadcast Title",
          message: "Broadcast Message",
          recipients: "ALL",
          channels: ["IN_APP"]
        })
        .expect(201);

      expect(res.body.recipientCount).toBeDefined();
      expect(res.body.results.inApp.count).toBeGreaterThanOrEqual(1);
    });

    it("/notifications/me (GET) - should allow affiliate to see notifications", async () => {
      const res = await request(app.getHttpServer())
        .get("/notifications/me")
        .set("Cookie", affiliateCookies)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBeTruthy();
    });
  });

  describe("TrainingController", () => {
    let moduleId: string;

    it("/training/admin/modules (POST) - should create training module", async () => {
      const res = await request(app.getHttpServer())
        .post("/training/admin/modules")
        .set("Cookie", adminCookies)
        .send({
          title: "Test Module",
          description: "Test Description",
          content: "Test Content",
          order: 1,
          category: "Sales",
          isPublished: true,
          pdfUrl: "https://example.com/test.pdf",
          quizzes: [
            {
              question: "Q1",
              options: ["A", "B"],
              correctAnswer: 0,
              order: 1,
            },
          ],
          scenarios: [
            {
              title: "Test Scenario",
              situation: "Sit",
              objection: "Obj",
              idealResponse: "Response",
              options: ["Correct", "Wrong"],
              correctAnswerIndex: 0,
              order: 1,
            },
          ],
        })
        .expect(201);

      moduleId = res.body.id;
      expect(res.body.title).toBe("Test Module");
      expect(res.body.pdfUrl).toBe("https://example.com/test.pdf");
    });

    it("/training/admin/modules/:id (GET) - should return full module details with scenarios", async () => {
      const res = await request(app.getHttpServer())
        .get(`/training/admin/modules/${moduleId}`)
        .set("Cookie", adminCookies)
        .expect(200);

      expect(res.body.scenarios).toHaveLength(1);
      expect(res.body.scenarios[0].options).toEqual(["Correct", "Wrong"]);
      expect(res.body.scenarios[0].correctAnswerIndex).toBe(0);
    });

    it("/training/modules (GET) - should allow affiliate to see published modules", async () => {
      const res = await request(app.getHttpServer())
        .get("/training/modules")
        .set("Cookie", affiliateCookies)
        .expect(200);

      expect(res.body.data.some((m: any) => m.id === moduleId)).toBeTruthy();
    });
  });
});
