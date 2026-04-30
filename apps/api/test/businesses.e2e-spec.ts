import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import * as cookieParser from "cookie-parser";
import { PrismaService } from "../src/prisma/prisma.service";
import { Role, PlanType } from "@prisma/client";
import * as bcrypt from "bcryptjs";

describe("BusinessesController (e2e)", () => {
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
    await prismaService.business.deleteMany({});
    await prismaService.user.deleteMany({});

    const password = await bcrypt.hash("password123", 10);
    await prismaService.user.create({
      data: {
        email: "agent@vemtap.com",
        fullName: "Agent User",
        phone: "1234567890",
        password,
        role: Role.AFFILIATE,
        referralCode: "AGENT001",
      },
    });

    const loginRes = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "agent@vemtap.com", password: "password123" });

    const setCookie = loginRes.headers["set-cookie"] as any;
    cookies = setCookie.map((c: string) => c.split(";")[0]);
  });

  afterAll(async () => {
    await prismaService.business.deleteMany({});
    await prismaService.user.deleteMany({});
    await app.close();
  });

  it("/businesses (POST) - should register a business and calculate 15% commission", async () => {
    const res = await request(app.getHttpServer())
      .post("/businesses")
      .set("Cookie", cookies)
      .send({
        businessName: "Test Biz",
        ownerName: "Owner",
        email: "biz@test.com",
        phone: "000",
        planType: PlanType.BASIC,
        referralCode: "AGENT001",
      })
      .expect(201);

    expect(res.body.businessName).toBe("Test Biz");
    expect(Number(res.body.subscriptionAmount)).toBe(3000);
    expect(Number(res.body.commissionAmount)).toBe(450); // 15% of 3000
  });

  it("/businesses/me (GET) - should return user businesses", async () => {
    const res = await request(app.getHttpServer())
      .get("/businesses/me")
      .set("Cookie", cookies)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBeTruthy();
    expect(res.body.data.length).toBe(1);
  });
});
