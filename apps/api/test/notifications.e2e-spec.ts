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

describe("NotificationsController (e2e)", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let adminCookies: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ResendService)
      .useValue({
        sendBroadcastEmail: jest.fn().mockResolvedValue(true),
      })
      .overrideProvider(PushService)
      .useValue({
        broadcastPush: jest.fn().mockResolvedValue(true),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
    await prismaService.notification.deleteMany({});
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
    adminCookies = loginResponse.get("Set-Cookie") || [];
  });

  afterAll(async () => {
    await prismaService.pushSubscription.deleteMany({});
    await app.close();
  });

  describe("POST /notifications/broadcast", () => {
    it("should allow admin to broadcast to all", async () => {
      await prismaService.user.create({
        data: {
          email: "affiliate@example.com",
          password: "password123",
          fullName: "Affiliate User",
          phone: "08033334444",
          referralCode: "AFF-001",
          role: Role.AFFILIATE,
          status: "ACTIVE",
        },
      });

      const response = await request(app.getHttpServer())
        .post("/notifications/broadcast")
        .set("Cookie", adminCookies)
        .send({
          type: "SYSTEM",
          title: "Test Broadcast",
          message: "Test Message",
          recipients: "ALL",
          channels: ["IN_APP"],
        });

      expect(response.status).toBe(201);
      expect(response.body.recipientCount).toBeGreaterThan(0);
      
      const notifications = await prismaService.notification.findMany({
        where: { title: "Test Broadcast" }
      });
      expect(notifications.length).toBeGreaterThan(0);
    });

    it("should filter by TOP_EARNERS", async () => {
      await prismaService.user.create({
        data: {
          email: "top@example.com",
          password: "password123",
          fullName: "Top Earner",
          phone: "09012345678",
          referralCode: "TOP-123",
          role: Role.AFFILIATE,
          status: "ACTIVE",
          totalEarnings: 15000,
        },
      });

      const response = await request(app.getHttpServer())
        .post("/notifications/broadcast")
        .set("Cookie", adminCookies)
        .send({
          type: "PROMOTIONAL",
          title: "Top Earner Msg",
          message: "VIP Only",
          recipients: "TOP_EARNERS",
          channels: ["IN_APP"],
        });

      expect(response.status).toBe(201);
      expect(response.body.recipientCount).toBe(1);
    });
  });

  describe("push subscription endpoints", () => {
    const endpoint = "https://push.example/endpoint-1";

    it("GET /notifications/push-vapid-public-key returns the public key", async () => {
      const response = await request(app.getHttpServer())
        .get("/notifications/push-vapid-public-key");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("publicKey");
    });

    it("POST /notifications/push-subscription stores a subscription", async () => {
      const response = await request(app.getHttpServer())
        .post("/notifications/push-subscription")
        .set("Cookie", adminCookies)
        .send({ endpoint, p256dh: "p256dh-1", auth: "auth-1", userAgent: "jest" });

      expect(response.status).toBe(201);
      expect(response.body.endpoint).toBe(endpoint);

      const stored = await prismaService.pushSubscription.findUnique({ where: { endpoint } });
      expect(stored).toBeDefined();
      expect(stored!.p256dh).toBe("p256dh-1");
    });

    it("POST /notifications/push-subscription updates an existing subscription", async () => {
      const response = await request(app.getHttpServer())
        .post("/notifications/push-subscription")
        .set("Cookie", adminCookies)
        .send({ endpoint, p256dh: "p256dh-2", auth: "auth-2", userAgent: "jest" });

      expect(response.status).toBe(201);
      expect(response.body.p256dh).toBe("p256dh-2");

      const stored = await prismaService.pushSubscription.findUnique({ where: { endpoint } });
      expect(stored!.p256dh).toBe("p256dh-2");
    });

    it("DELETE /notifications/push-subscription removes the subscription", async () => {
      const response = await request(app.getHttpServer())
        .delete("/notifications/push-subscription")
        .set("Cookie", adminCookies)
        .send({ endpoint });

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);

      const stored = await prismaService.pushSubscription.findUnique({ where: { endpoint } });
      expect(stored).toBeNull();
    });
  });
});
