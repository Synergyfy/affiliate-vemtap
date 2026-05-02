import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as cookieParser from 'cookie-parser';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let cookies: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
    // Cleanup DB before starting
    await prismaService.user.deleteMany({});
  });

  afterAll(async () => {
    await prismaService.user.deleteMany({});
    await app.close();
  });

  function extractCookies(res: request.Response): string[] {
    const setCookie = res.headers['set-cookie'] as string | string[];
    const arr = Array.isArray(setCookie) ? setCookie : [setCookie];
    return arr.map((cookie: string) => cookie.split(';')[0]);
  }

  describe('/auth/signup (POST)', () => {
    it('should register a new user and return cookies', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          fullName: 'E2E Test User',
          email: 'e2e@example.com',
          phone: '0987654321',
          password: 'password123',
        })
        .expect(201);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('e2e@example.com');
      expect(res.body.user).not.toHaveProperty('password');

      const setCookie = res.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      cookies = extractCookies(res);

      expect(cookies.some((c) => c.startsWith('access_token='))).toBeTruthy();
      expect(cookies.some((c) => c.startsWith('refresh_token='))).toBeTruthy();
    });

    it('should reject duplicate signup', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          fullName: 'E2E Test User',
          email: 'e2e@example.com',
          phone: '0987654321',
          password: 'password123',
        })
        .expect(409);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login and return new cookies', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'e2e@example.com',
          password: 'password123',
        })
        .expect(200);

      cookies = extractCookies(res);
      expect(cookies.some((c) => c.startsWith('access_token='))).toBeTruthy();
    });

    it('should reject invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'e2e@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('/auth/me (GET)', () => {
    it('should return user profile using access token cookie', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.user.email).toBe('e2e@example.com');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });
  });

  describe('/auth/refresh (POST)', () => {
    it('should issue new tokens using valid refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.user).toBeDefined();
      const setCookie = res.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      // Update cookies with new tokens
      cookies = extractCookies(res);
    });

    it('should reject refresh without cookie', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .expect(401);
    });
  });

  describe('/auth/invalidate-all (POST)', () => {
    it('should increment tokenVersion and clear cookies', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/invalidate-all')
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.message).toBeDefined();
    });

    it('should reject refresh after invalidation due to tokenVersion mismatch', async () => {
      // The old cookies have old tokenVersion — refresh should now fail
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', cookies)
        .expect(401);
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should clear cookies on logout', async () => {
      // Re-login to get fresh cookies
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'e2e@example.com', password: 'password123' })
        .expect(200);

      const freshCookies = extractCookies(loginRes);

      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', freshCookies)
        .expect(200);

      expect(res.body.message).toContain('Logged out');
    });
  });
});
