import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import * as cookieParser from "cookie-parser";
import { PrismaService } from "../src/prisma/prisma.service";
import { Role, Tier } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { ResendService } from "../src/otp/resend.service";
import { PaystackService } from "../src/payments/paystack.service";
import { RedisService } from "../src/redis/redis.service";

describe("UsersController (e2e)", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let cookies: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RedisService)
      .useValue({
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue("OK"),
        del: jest.fn().mockResolvedValue(1),
        getClient: jest.fn().mockReturnValue({}),
      })
      .overrideProvider(ResendService)
      .useValue({
        sendOtpEmail: jest.fn().mockResolvedValue(true),
      })
      .overrideProvider(PaystackService)
      .useValue({
        listBanks: jest.fn().mockResolvedValue([]),
        createTransferRecipient: jest.fn().mockResolvedValue({ recipient_code: "RCP_TEST" }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
    await prismaService.user.deleteMany({});

    const password = await bcrypt.hash("password123", 10);
    await prismaService.user.create({
      data: {
        email: "profile@test.com",
        fullName: "Original Name",
        phone: "999",
        password,
        role: Role.AFFILIATE,
        referralCode: "PROF01",
      },
    });

    const loginRes = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "profile@test.com", password: "password123" });

    cookies = (loginRes.headers["set-cookie"] as any).map(
      (c: string) => c.split(";")[0],
    );
  });

  afterAll(async () => {
    await prismaService.user.deleteMany({});
    await app.close();
  });

  it("/users/profile (GET) - should return current user profile", async () => {
    const res = await request(app.getHttpServer())
      .get("/users/profile")
      .set("Cookie", cookies)
      .expect(200);

    expect(res.body.fullName).toBe("Original Name");
    expect(res.body.email).toBe("profile@test.com");
    expect(res.body.password).toBeUndefined();
  });

  it("/users/profile (PATCH) - should update tier based on referral count", async () => {
    // Manually set referral count to 15 (SILVER tier: 11-50)
    await prismaService.user.update({
      where: { email: "profile@test.com" },
      data: { referralCount: 15 },
    });

    const res = await request(app.getHttpServer())
      .patch("/users/profile")
      .set("Cookie", cookies)
      .send({ fullName: "Tier Tester" })
      .expect(200);

    expect(res.body.tier).toBe(Tier.SILVER);

    // Update to 60 (GOLD tier: 51+)
    await prismaService.user.update({
      where: { email: "profile@test.com" },
      data: { referralCount: 60 },
    });

    const resGold = await request(app.getHttpServer())
      .patch("/users/profile")
      .set("Cookie", cookies)
      .send({ fullName: "Gold Tester" })
      .expect(200);

    expect(resGold.body.tier).toBe(Tier.GOLD);
  });

  describe("Affiliate Agreement", () => {
    it("/users/agreement/status (GET) - should show status", async () => {
      const res = await request(app.getHttpServer())
        .get("/users/agreement/status")
        .set("Cookie", cookies)
        .expect(200);

      expect(res.body).toHaveProperty("isUpToDate");
      expect(res.body.isUpToDate).toBe(false); // Initially signedVersion is null, settings version is 1
    });

    it("/users/agreement/sign (POST) - should sign agreement", async () => {
      const res = await request(app.getHttpServer())
        .post("/users/agreement/sign")
        .set("Cookie", cookies)
        .expect(201);

      expect(res.body.signedAgreementVersion).toBe(1);
      
      const statusRes = await request(app.getHttpServer())
        .get("/users/agreement/status")
        .set("Cookie", cookies)
        .expect(200);
      expect(statusRes.body.isUpToDate).toBe(true);
    });
  });

  it("should complete the email update flow via OTP", async () => {
    const newEmail = "newprofile@test.com";

    // 1. Request update
    await request(app.getHttpServer())
      .post("/users/request-email-update")
      .set("Cookie", cookies)
      .send({ newEmail })
      .expect(201);

    // 2. Get code from DB
    const user = await prismaService.user.findFirst({
      where: { email: "profile@test.com" },
    });
    const code = user?.emailVerificationCode;
    expect(code).toBeDefined();

    // 3. Verify update
    const verifyRes = await request(app.getHttpServer())
      .post("/users/verify-email-update")
      .set("Cookie", cookies)
      .send({ code })
      .expect(201);

    expect(verifyRes.body.email).toBe(newEmail);

    // 4. Verify login with new email
    await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: newEmail, password: "password123" })
      .expect(200);
  });
});
