import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import * as cookieParser from "cookie-parser";
import { PrismaService } from "../src/prisma/prisma.service";
import { Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { ConfigService } from "@nestjs/config";

describe("Tracking & ShortLinks (e2e)", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let configService: ConfigService;
  let cookies: string[] = [];
  let trackingSecret: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
    configService = app.get<ConfigService>(ConfigService);
    trackingSecret = configService.get<string>('VEMTAP_TRACKING_SECRET_TOKEN') || 'vemtap_track_secret_998877665544';

    await prismaService.linkClick.deleteMany({});
    await prismaService.shortLink.deleteMany({});
    await prismaService.user.deleteMany({});

    const password = await bcrypt.hash("password123", 10);
    await prismaService.user.create({
      data: {
        email: "affiliate@test.com",
        fullName: "Test Affiliate",
        phone: "111222333",
        password,
        role: Role.AFFILIATE,
        referralCode: "TRACK_REF_01",
      },
    });

    const loginRes = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "affiliate@test.com", password: "password123" });

    cookies = (loginRes.headers["set-cookie"] as any).map(
      (c: string) => c.split(";")[0],
    );
  });

  afterAll(async () => {
    await prismaService.linkClick.deleteMany({});
    await prismaService.shortLink.deleteMany({});
    await prismaService.user.deleteMany({});
    await app.close();
  });

  describe("ShortLinks Management", () => {
    it("/tools/short-links (POST) - should create a short link", async () => {
      const res = await request(app.getHttpServer())
        .post("/tools/short-links")
        .set("Cookie", cookies)
        .send({ code: "my-link" })
        .expect(201);

      expect(res.body.code).toBe("my-link");
      expect(res.body.fullUrl).toContain("my-link");
    });

    it("/tools/short-links (POST) - should fail if code already exists", async () => {
      await request(app.getHttpServer())
        .post("/tools/short-links")
        .set("Cookie", cookies)
        .send({ code: "my-link" })
        .expect(409);
    });

    it("/tools/short-links (GET) - should list short links", async () => {
      const res = await request(app.getHttpServer())
        .get("/tools/short-links")
        .set("Cookie", cookies)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].code).toBe("my-link");
      expect(res.body[0].clickCount).toBeDefined();
    });
  });

  describe("Tracking Notification", () => {
    it("/tracking/notify-click (POST) - should record a referral click", async () => {
      await request(app.getHttpServer())
        .post("/tracking/notify-click")
        .send({
          referralCode: "TRACK_REF_01",
          secret: trackingSecret,
          ip: "1.1.1.1",
        })
        .expect(201);

      const clicks = await prismaService.linkClick.findMany({
        where: { referralCode: "TRACK_REF_01" },
      });
      expect(clicks.length).toBe(1);
      expect(clicks[0].ip).toBe("1.1.1.1");
      expect(clicks[0].userId).toBeDefined(); // Should be attributed
    });

    it("/tracking/notify-click (POST) - should record a short link click", async () => {
      await request(app.getHttpServer())
        .post("/tracking/notify-click")
        .send({
          shortLinkCode: "my-link",
          secret: trackingSecret,
        })
        .expect(201);

      const clicks = await prismaService.linkClick.findMany({
        where: { shortLinkCode: "my-link" },
      });
      expect(clicks.length).toBe(1);
      expect(clicks[0].userId).toBeDefined(); // Should be attributed
    });

    it("/tracking/notify-click (POST) - should fail with invalid secret", async () => {
      await request(app.getHttpServer())
        .post("/tracking/notify-click")
        .send({
          referralCode: "TRACK_REF_01",
          secret: "wrong-secret",
        })
        .expect(401);
    });
  });

  describe("Dashboard Integration", () => {
    it("/affiliate/dashboard/stats (GET) - should reflect click counts", async () => {
      const res = await request(app.getHttpServer())
        .get("/affiliate/dashboard/stats")
        .set("Cookie", cookies)
        .expect(200);

      expect(res.body.totalClicks).toBe(2); // 1 referral + 1 short link click
    });

    it("/affiliate/dashboard/charts (GET) - should include click trends", async () => {
      const res = await request(app.getHttpServer())
        .get("/affiliate/dashboard/charts")
        .set("Cookie", cookies)
        .expect(200);

      expect(res.body.clickTrends).toBeDefined();
      expect(res.body.clickTrends.length).toBe(30);
      const totalInTrends = res.body.clickTrends.reduce((sum: number, day: { value: number }) => sum + day.value, 0);
      expect(totalInTrends).toBe(2);
    });
  });
});
