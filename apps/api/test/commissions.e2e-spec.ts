import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as cookieParser from 'cookie-parser';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role, PlanType, BusinessStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Admin Businesses & Commissions (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let adminCookies: string[] = [];
  let affiliateId: string;
  let managerId: string;
  let businessId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
    await prismaService.commission.deleteMany({});
    await prismaService.business.deleteMany({});
    await prismaService.user.deleteMany({});

    const password = await bcrypt.hash('password123', 10);

    // 1. Create Manager
    const manager = await prismaService.user.create({
      data: {
        email: 'manager@test.com',
        fullName: 'Manager',
        phone: '111',
        password,
        role: Role.AFFILIATE,
        referralCode: 'MGR01',
      },
    });
    managerId = manager.id;

    // 2. Create Affiliate (referred by manager)
    const affiliate = await prismaService.user.create({
      data: {
        email: 'aff@test.com',
        fullName: 'Affiliate',
        phone: '222',
        password,
        role: Role.AFFILIATE,
        referralCode: 'AFF01',
        referrerId: managerId,
      },
    });
    affiliateId = affiliate.id;

    // 3. Create Admin
    await prismaService.user.create({
      data: {
        email: 'admin@test.com',
        fullName: 'Admin',
        phone: '333',
        password,
        role: Role.ADMIN,
        referralCode: 'ADM01',
      },
    });

    // 4. Create Business for Affiliate
    const business = await prismaService.business.create({
      data: {
        businessName: 'Biz 1',
        ownerName: 'Owner',
        email: 'biz@test.com',
        phone: '000',
        planType: PlanType.BASIC,
        referralCode: 'AFF01',
        affiliateId: affiliateId,
        subscriptionAmount: 10000,
        status: BusinessStatus.TRIAL,
      },
    });
    businessId = business.id;

    // Login Admin
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminCookies = (loginRes.headers['set-cookie'] as any).map((c: string) => c.split(';')[0]);
  });

  afterAll(async () => {
    await prismaService.commission.deleteMany({});
    await prismaService.business.deleteMany({});
    await prismaService.user.deleteMany({});
    await app.close();
  });

  it('should allow admin to activate business and trigger commissions', async () => {
    // 1. Activate Business
    await request(app.getHttpServer())
      .patch(`/businesses/${businessId}/status`)
      .set('Cookie', adminCookies)
      .send({ status: BusinessStatus.ACTIVE })
      .expect(200);

    // 2. Check Commissions
    const commissions = await prismaService.commission.findMany({
      where: { businessId },
    });

    expect(commissions.length).toBe(2);
    
    const direct = commissions.find(c => c.type === 'DIRECT');
    const indirect = commissions.find(c => c.type === 'INDIRECT');

    expect(Number(direct?.amount)).toBe(1500); // 15% of 10000
    expect(direct?.userId).toBe(affiliateId);

    expect(Number(indirect?.amount)).toBe(500); // 5% of 10000
    expect(indirect?.userId).toBe(managerId);

    // 3. Check User Balances
    const affUser = await prismaService.user.findUnique({ where: { id: affiliateId } });
    const mgrUser = await prismaService.user.findUnique({ where: { id: managerId } });

    expect(Number(affUser?.totalEarnings)).toBe(1500);
    expect(Number(mgrUser?.totalEarnings)).toBe(500);
  });
});
