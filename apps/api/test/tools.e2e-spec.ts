import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as cookieParser from 'cookie-parser';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role, ToolType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('ToolsController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let adminCookies: string[] = [];
  let affiliateCookies: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
    
    // Cleanup
    await prismaService.marketingTool.deleteMany({});
    await prismaService.user.deleteMany({});

    const password = await bcrypt.hash('password123', 10);

    // Create Admin
    await prismaService.user.create({
      data: {
        email: 'admin@vemtap.com',
        fullName: 'Admin User',
        phone: '1111111111',
        password,
        role: Role.ADMIN,
        referralCode: 'ADMIN001',
      },
    });

    // Create Affiliate
    await prismaService.user.create({
      data: {
        email: 'affiliate@vemtap.com',
        fullName: 'Affiliate User',
        phone: '2222222222',
        password,
        role: Role.AFFILIATE,
        referralCode: 'AFF001',
      },
    });

    // Login Admin
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@vemtap.com', password: 'password123' });
    adminCookies = extractCookies(adminLogin);

    // Login Affiliate
    const affiliateLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'affiliate@vemtap.com', password: 'password123' });
    affiliateCookies = extractCookies(affiliateLogin);
  });

  afterAll(async () => {
    await prismaService.marketingTool.deleteMany({});
    await prismaService.user.deleteMany({});
    await app.close();
  });

  function extractCookies(res: request.Response): string[] {
    const setCookie = res.headers['set-cookie'] as string | string[];
    const arr = Array.isArray(setCookie) ? setCookie : [setCookie];
    return arr.map((cookie: string) => cookie.split(';')[0]);
  }

  describe('/tools (POST)', () => {
    it('should allow admin to create a tool', async () => {
      const res = await request(app.getHttpServer())
        .post('/tools')
        .set('Cookie', adminCookies)
        .send({
          title: 'Welcome Banner',
          type: ToolType.BANNER,
          content: 'https://example.com/banner.png',
          category: 'Social Media',
        })
        .expect(201);

      expect(res.body.title).toBe('Welcome Banner');
    });

    it('should block affiliate from creating a tool', async () => {
      await request(app.getHttpServer())
        .post('/tools')
        .set('Cookie', affiliateCookies)
        .send({
          title: 'Hacked Tool',
          type: ToolType.BANNER,
          content: 'url',
        })
        .expect(403);
    });
  });

  describe('/tools (GET)', () => {
    it('should allow affiliate to see published tools', async () => {
      const res = await request(app.getHttpServer())
        .get('/tools')
        .set('Cookie', affiliateCookies)
        .expect(200);

      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should block unauthenticated access', async () => {
      await request(app.getHttpServer())
        .get('/tools')
        .expect(401);
    });
  });
});
