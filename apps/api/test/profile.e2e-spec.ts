import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import * as cookieParser from "cookie-parser";
import { PrismaService } from "../src/prisma/prisma.service";
import { Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";

describe("Profile (e2e)", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let cookies: string[] = [];
  let userId: string;

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
    await prismaService.user.deleteMany({});

    const password = await bcrypt.hash("password123", 10);
    const user = await prismaService.user.create({
      data: {
        email: "profile@vemtap.com",
        fullName: "Profile User",
        phone: "08011223344",
        password,
        role: Role.AFFILIATE,
        referralCode: "PROF001",
      },
    });
    userId = user.id;

    // Login to get cookies
    const loginResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: "profile@vemtap.com",
        password: "password123",
      });
    cookies = loginResponse.get("Set-Cookie") || [];
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /users/profile", () => {
    it("should return the current user profile", async () => {
      const response = await request(app.getHttpServer())
        .get("/users/profile")
        .set("Cookie", cookies)
        .expect(200);

      expect(response.body).toHaveProperty("id", userId);
      expect(response.body).toHaveProperty("email", "profile@vemtap.com");
      expect(response.body).toHaveProperty("fullName", "Profile User");
      expect(response.body).not.toHaveProperty("password");
    });

    it("should fail if not authenticated", async () => {
      await request(app.getHttpServer())
        .get("/users/profile")
        .expect(401);
    });
  });

  describe("PATCH /users/profile", () => {
    it("should update profile fields including avatar", async () => {
      const updateData = {
        fullName: "Updated Name",
        phone: "08099887766",
        avatar: "https://example.com/new-avatar.jpg",
        bankName: "Zenith Bank",
        accountNumber: "1234567890",
        accountName: "Updated Account Name"
      };

      const response = await request(app.getHttpServer())
        .patch("/users/profile")
        .set("Cookie", cookies)
        .send(updateData)
        .expect(200);

      expect(response.body.fullName).toBe(updateData.fullName);
      expect(response.body.phone).toBe(updateData.phone);
      expect(response.body.avatar).toBe(updateData.avatar);
      
      // Verify in DB
      const user = await prismaService.user.findUnique({ where: { id: userId } });
      expect(user?.fullName).toBe(updateData.fullName);
      expect(user?.avatar).toBe(updateData.avatar);
    });

    it("should fail if phone is already in use", async () => {
      // Create another user
      await prismaService.user.create({
        data: {
          email: "other@vemtap.com",
          fullName: "Other User",
          phone: "08055555555",
          password: "password123",
          referralCode: "OTHER001"
        }
      });

      await request(app.getHttpServer())
        .patch("/users/profile")
        .set("Cookie", cookies)
        .send({ phone: "08055555555" })
        .expect(409);
    });
  });
});
