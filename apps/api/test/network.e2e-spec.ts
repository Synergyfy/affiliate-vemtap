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
});
