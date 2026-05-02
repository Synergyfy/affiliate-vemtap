import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import * as cookieParser from "cookie-parser";
import { PrismaService } from "../src/prisma/prisma.service";
import { Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";

describe("UsersController (e2e)", () => {
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

  it("/users/profile (PATCH) - should update profile", async () => {
    const res = await request(app.getHttpServer())
      .patch("/users/profile")
      .set("Cookie", cookies)
      .send({
        fullName: "Updated Name",
        bankName: "Test Bank",
        accountNumber: "123456",
      })
      .expect(200);

    expect(res.body.fullName).toBe("Updated Name");
    expect(res.body.bankName).toBe("Test Bank");
    expect(res.body.accountNumber).toBe("123456");
  });

  it("/users/profile (PATCH) - should update password and still allow login", async () => {
    await request(app.getHttpServer())
      .patch("/users/profile")
      .set("Cookie", cookies)
      .send({ password: "newpassword123" })
      .expect(200);

    // Try logging in with new password
    await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "profile@test.com", password: "newpassword123" })
      .expect(200);
  });
});
