import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import * as cookieParser from "cookie-parser";
import { PrismaService } from "../src/prisma/prisma.service";
import { Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";

describe("Fraud Detection (e2e)", () => {
  let app: INestApplication;
  let prismaService: PrismaService;

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
    await prismaService.fraudAlert.deleteMany({});
    await prismaService.user.deleteMany({});
    await prismaService.platformSettings.deleteMany({});
    
    // Ensure default settings exist with maxIpUsage 1
    await prismaService.platformSettings.create({
      data: {
        maxIpUsage: 1,
      },
    });
  });

  afterAll(async () => {
    await prismaService.user.deleteMany({});
    await app.close();
  });

  it("should trigger FraudAlert when multiple users login from same IP", async () => {
    const password = await bcrypt.hash("password123", 10);
    const testIp = "1.2.3.4";

    // 1. Create and login User A from Test IP
    const userA = await prismaService.user.create({
      data: {
        email: "usera@test.com",
        fullName: "User A",
        phone: "111",
        password,
        role: Role.AFFILIATE,
        referralCode: "USERA",
      },
    });

    await request(app.getHttpServer())
      .post("/auth/login")
      .set("X-Forwarded-For", testIp)
      .send({ email: "usera@test.com", password: "password123" })
      .expect(200);

    // 2. Create and login User B from SAME Test IP
    const userB = await prismaService.user.create({
      data: {
        email: "userb@test.com",
        fullName: "User B",
        phone: "222",
        password,
        role: Role.AFFILIATE,
        referralCode: "USERB",
      },
    });

    await request(app.getHttpServer())
      .post("/auth/login")
      .set("X-Forwarded-For", testIp)
      .send({ email: "userb@test.com", password: "password123" })
      .expect(200);

    // 3. Check if FraudAlert was created for User B
    const alerts = await prismaService.fraudAlert.findMany({
      where: { userId: userB.id, type: "MULTIPLE_ACCOUNTS" }
    });

    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].description).toContain(testIp);
  });
});
