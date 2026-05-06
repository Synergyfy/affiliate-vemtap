import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import * as cookieParser from "cookie-parser";
import { PrismaService } from "../src/prisma/prisma.service";
import { Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";

describe("ApiKeys (e2e)", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let adminCookies: string[] = [];
  let apiKeyId: string;
  let rawApiKey: string;

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

    // Cleanup
    await prismaService.apiKey.deleteMany({});
    await prismaService.business.deleteMany({});
    await prismaService.user.deleteMany({});

    const password = await bcrypt.hash("password123", 10);

    // Create Admin
    const admin = await prismaService.user.create({
      data: {
        email: "admin@vemtap.com",
        fullName: "Admin User",
        phone: "1111111111",
        password,
        role: Role.ADMIN,
        referralCode: "ADMIN001",
      },
    });

    // Create a dummy affiliate for testing the external endpoint
    await prismaService.user.create({
      data: {
        email: "affiliate@vemtap.com",
        fullName: "Affiliate User",
        phone: "2222222222",
        password,
        role: Role.AFFILIATE,
        referralCode: "AFF001",
        status: "ACTIVE",
      },
    });

    // Login Admin
    const adminLogin = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "admin@vemtap.com", password: "password123" });

    const setCookie = adminLogin.headers["set-cookie"] as unknown as string[];
    adminCookies = setCookie.map((c: string) => c.split(";")[0]);
  });

  afterAll(async () => {
    await prismaService.apiKey.deleteMany({});
    await prismaService.business.deleteMany({});
    await prismaService.user.deleteMany({});
    await app.close();
  });

  describe("Admin API Key Management", () => {
    it("should allow admin to generate a new API key", async () => {
      const res = await request(app.getHttpServer())
        .post("/admin/api-keys")
        .set("Cookie", adminCookies)
        .send({ name: "Integration Test Key" })
        .expect(201);

      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("rawKey");
      expect(res.body.rawKey).toMatch(/^vem_[a-f0-9]{8}/);

      apiKeyId = res.body.id;
      rawApiKey = res.body.rawKey;
    });

    it("should list all API keys for admin", async () => {
      const res = await request(app.getHttpServer())
        .get("/admin/api-keys")
        .set("Cookie", adminCookies)
        .expect(200);

      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.some((k: any) => k.id === apiKeyId)).toBeTruthy();
      expect(res.body[0]).not.toHaveProperty("rawKey"); // Should not leak raw key
    });
  });

  describe("ApiKeyGuard Integration", () => {
    it("should allow access to external endpoints with a valid API key", async () => {
      const res = await request(app.getHttpServer())
        .get("/external/referrals/AFF001/validate")
        .set("x-api-key", rawApiKey)
        .expect(200);

      expect(res.body.valid).toBe(true);
      expect(res.body.affiliateId).toBeDefined();
    });

    it("should block access with an invalid API key", async () => {
      await request(app.getHttpServer())
        .get("/external/referrals/AFF001/validate")
        .set("x-api-key", "vem_invalid_key_format")
        .expect(401);
    });

    it("should block access without an API key", async () => {
      await request(app.getHttpServer())
        .get("/external/referrals/AFF001/validate")
        .expect(401);
    });
  });

  describe("Revocation", () => {
    it("should allow admin to revoke an API key", async () => {
      await request(app.getHttpServer())
        .delete(`/admin/api-keys/${apiKeyId}`)
        .set("Cookie", adminCookies)
        .expect(204);
    });

    it("should block access using a revoked API key", async () => {
      await request(app.getHttpServer())
        .get("/external/referrals/AFF001/validate")
        .set("x-api-key", rawApiKey)
        .expect(401);
    });
  });
});
