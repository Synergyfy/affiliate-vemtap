import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import * as cookieParser from "cookie-parser";
import { PrismaService } from "../src/prisma/prisma.service";
import { Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { ResendService } from "../src/otp/resend.service";
import { PaystackService } from "../src/payments/paystack.service";
import { RedisService } from "../src/redis/redis.service";

describe("StorageController (e2e)", () => {
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
        email: "storage@test.com",
        fullName: "Storage User",
        phone: "555",
        password,
        role: Role.AFFILIATE,
        referralCode: "STOR01",
      },
    });

    const loginRes = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "storage@test.com", password: "password123" });

    cookies = (loginRes.headers["set-cookie"] as any).map(
      (c: string) => c.split(";")[0],
    );
  });

  afterAll(async () => {
    await prismaService.user.deleteMany({});
    await app.close();
  });

  it("/storage/upload (POST) - should upload an image successfully", async () => {
    const res = await request(app.getHttpServer())
      .post("/storage/upload")
      .set("Cookie", cookies)
      .attach("file", Buffer.from("fake-image-content"), "test-image.png")
      .field("folder", "kyc")
      .expect(201);

    expect(res.body.url).toBeDefined();
    expect(res.body.url).toContain("storage.vemtap.com/kyc/");
    expect(res.body.url).toContain("test-image.png");
  });

  it("/storage/upload (POST) - should upload a PDF successfully", async () => {
    const res = await request(app.getHttpServer())
      .post("/storage/upload")
      .set("Cookie", cookies)
      .attach("file", Buffer.from("fake-pdf-content"), "test-doc.pdf")
      .expect(201);

    expect(res.body.url).toContain(".pdf");
  });

  it("/storage/upload (POST) - should fail for invalid file types", async () => {
    await request(app.getHttpServer())
      .post("/storage/upload")
      .set("Cookie", cookies)
      .attach("file", Buffer.from("fake-exe-content"), "danger.exe")
      .expect(400);
  });

  it("/storage/upload (POST) - should fail if not authenticated", async () => {
    await request(app.getHttpServer())
      .post("/storage/upload")
      .attach("file", Buffer.from("content"), "test.png")
      .expect(401);
  });
});
