import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as cookieParser from 'cookie-parser';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role, FraudStatus, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Admin Backend (e2e)', () => {
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
    
    // Setup test users
    const password = await bcrypt.hash('password123', 10);
    
    // Admin User
    const admin = await prismaService.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        email: 'admin@test.com',
        fullName: 'Admin User',
        phone: 'admin-phone',
        password,
        role: Role.ADMIN,
        referralCode: 'ADMIN01',
      },
    });

    // Affiliate User
    const affiliate = await prismaService.user.upsert({
      where: { email: 'affiliate@test.com' },
      update: {},
      create: {
        email: 'affiliate@test.com',
        fullName: 'Affiliate User',
        phone: 'affiliate-phone',
        password,
        role: Role.AFFILIATE,
        referralCode: 'AFF01',
      },
    });

    // Login Admin
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminCookies = (adminLogin.headers['set-cookie'] as any).map((c: string) => c.split(';')[0]);

    // Login Affiliate
    const affiliateLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'affiliate@test.com', password: 'password123' });
    affiliateCookies = (affiliateLogin.headers['set-cookie'] as any).map((c: string) => c.split(';')[0]);
  });

  afterAll(async () => {
    // Reset settings to defaults to avoid impacting other tests
    await prismaService.platformSettings.updateMany({
      data: {
        directCommissionRate: 0.15,
        indirectCommissionRate: 0.05,
        minWithdrawal: 5000,
        withdrawalFee: 100,
        subAffiliateUnlockCount: 5,
        fraudThresholdScore: 80,
      },
    });
    await app.close();
  });

  describe('DashboardController', () => {
    it('/admin/dashboard/stats (GET) - should return stats for admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/dashboard/stats')
        .set('Cookie', adminCookies)
        .expect(200);

      expect(res.body).toHaveProperty('totalAffiliates');
      expect(res.body).toHaveProperty('activeAffiliates');
    });

    it('/admin/dashboard/stats (GET) - should block affiliate', async () => {
      await request(app.getHttpServer())
        .get('/admin/dashboard/stats')
        .set('Cookie', affiliateCookies)
        .expect(403);
    });
  });

  describe('FraudController', () => {
    it('/fraud (GET) - should list fraud alerts', async () => {
      await request(app.getHttpServer())
        .get('/fraud')
        .set('Cookie', adminCookies)
        .expect(200);
    });

    it('/fraud/:id/status (PATCH) - should update fraud alert status', async () => {
      // Create a dummy fraud alert first
      const alert = await prismaService.fraudAlert.create({
        data: {
          userId: 'some-user-id',
          type: 'SELF_REFERRAL',
          severity: 'HIGH',
          description: 'Test fraud',
        },
      });

      const res = await request(app.getHttpServer())
        .patch(`/fraud/${alert.id}/status`)
        .set('Cookie', adminCookies)
        .send({ status: FraudStatus.RESOLVED, resolution: 'Fixed' })
        .expect(200);

      expect(res.body.status).toBe(FraudStatus.RESOLVED);
      expect(res.body.resolution).toBe('Fixed');
    });
  });

  describe('SettingsController', () => {
    it('/settings (GET) - should return platform settings', async () => {
      const res = await request(app.getHttpServer())
        .get('/settings')
        .set('Cookie', adminCookies)
        .expect(200);

      expect(res.body).toHaveProperty('directCommissionRate');
    });

    it('/settings (PATCH) - should update platform settings', async () => {
      const res = await request(app.getHttpServer())
        .patch('/settings')
        .set('Cookie', adminCookies)
        .send({ directCommissionRate: 0.20 })
        .expect(200);

      expect(Number(res.body.directCommissionRate)).toBe(0.20);
    });
  });

  describe('NotificationsController', () => {
    it('/notifications/broadcast (POST) - should broadcast notification', async () => {
      const res = await request(app.getHttpServer())
        .post('/notifications/broadcast')
        .set('Cookie', adminCookies)
        .send({
          type: NotificationType.SYSTEM,
          title: 'Broadcast Title',
          message: 'Broadcast Message',
        })
        .expect(201);

      expect(res.body.count).toBeDefined();
    });

    it('/notifications/me (GET) - should allow affiliate to see notifications', async () => {
      const res = await request(app.getHttpServer())
        .get('/notifications/me')
        .set('Cookie', affiliateCookies)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBeTruthy();
    });
  });

  describe('TrainingController', () => {
    let moduleId: string;

    it('/training/admin/modules (POST) - should create training module', async () => {
      const res = await request(app.getHttpServer())
        .post('/training/admin/modules')
        .set('Cookie', adminCookies)
        .send({
          title: 'Test Module',
          description: 'Test Description',
          content: 'Test Content',
          order: 1,
          category: 'Sales',
          isPublished: true,
          quizzes: [
            {
              question: 'Q1',
              options: ['A', 'B'],
              correctAnswer: 0,
              order: 1,
            },
          ],
        })
        .expect(201);

      moduleId = res.body.id;
      expect(res.body.title).toBe('Test Module');
    });

    it('/training/modules (GET) - should allow affiliate to see published modules', async () => {
      const res = await request(app.getHttpServer())
        .get('/training/modules')
        .set('Cookie', affiliateCookies)
        .expect(200);

      expect(res.body.data.some((m: any) => m.id === moduleId)).toBeTruthy();
    });
  });
});
