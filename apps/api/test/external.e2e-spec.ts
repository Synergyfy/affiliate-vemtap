import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as cookieParser from 'cookie-parser';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role, UserStatus, PlanType, KycStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

describe('External Endpoints (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let rawApiKey: string;
  let adminId: string;

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

    // Cleanup first to avoid any conflicts
    await prismaService.externalSyncLog.deleteMany({});
    await prismaService.withdrawal.deleteMany({});
    await prismaService.commission.deleteMany({});
    await prismaService.business.deleteMany({});
    await prismaService.apiKey.deleteMany({});
    await prismaService.user.deleteMany({});
    await prismaService.platformSettings.deleteMany({});

    const passwordHash = await bcrypt.hash('password123', 10);

    // Create Platform Settings
    await prismaService.platformSettings.create({
      data: {
        directCommissionRate: 0.15,
        indirectCommissionRate: 0.05,
        minWithdrawal: 5000,
        withdrawalFee: 100,
        subAffiliateUnlockCount: 5,
        fraudThresholdScore: 80,
        referralUnlockCount: 0,
        earningDurationMonths: 12,
      },
    });

    // Create Admin user
    const admin = await prismaService.user.create({
      data: {
        email: 'admin@vemtap.com',
        fullName: 'Admin User',
        phone: '1111111111',
        password: passwordHash,
        role: Role.ADMIN,
        referralCode: 'ADMIN001',
      },
    });
    adminId = admin.id;

    // Create active, suspended, and deactivated affiliates
    await prismaService.user.create({
      data: {
        email: 'john@affiliate.com',
        fullName: 'John Doe',
        phone: '+2348012345678',
        password: passwordHash,
        role: Role.AFFILIATE,
        referralCode: 'VEM-JD123',
        status: UserStatus.ACTIVE,
      },
    });

    await prismaService.user.create({
      data: {
        email: 'jane@affiliate.com',
        fullName: 'Jane Smith',
        phone: '+2348022222222',
        password: passwordHash,
        role: Role.AFFILIATE,
        referralCode: 'VEM-JS456',
        status: UserStatus.SUSPENDED,
      },
    });

    await prismaService.user.create({
      data: {
        email: 'bob@affiliate.com',
        fullName: 'Bob Johnson',
        phone: '+2348033333333',
        password: passwordHash,
        role: Role.AFFILIATE,
        referralCode: 'VEM-BJ789',
        status: UserStatus.DEACTIVATED,
      },
    });

    // KYC-verified affiliate with withdrawable earnings (for withdrawal tests)
    await prismaService.user.create({
      data: {
        email: 'carol@affiliate.com',
        fullName: 'Carol Nwosu',
        phone: '+2348044444444',
        password: passwordHash,
        role: Role.AFFILIATE,
        referralCode: 'VEM-CN101',
        status: UserStatus.ACTIVE,
        kycStatus: KycStatus.VERIFIED,
        pendingEarnings: 100000,
        bankName: 'GTBank',
        accountNumber: '0123456789',
        accountName: 'Carol Nwosu',
      },
    });

    // Create a mock active API key
    const prefixId = '3774d66b';
    const secret = 'a1ac7392c877d121bb3c919b65df2c9d11b66555f2e4efe6';
    rawApiKey = `vem_${prefixId}${secret}`;
    const prefix = `vem_${prefixId}`;
    const keyHash = await bcrypt.hash(rawApiKey, 10);

    await prismaService.apiKey.create({
      data: {
        name: 'Vemtap Integration Key',
        keyHash,
        prefix,
        createdById: adminId,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    await prismaService.externalSyncLog.deleteMany({});
    await prismaService.withdrawal.deleteMany({});
    await prismaService.commission.deleteMany({});
    await prismaService.business.deleteMany({});
    await prismaService.apiKey.deleteMany({});
    await prismaService.user.deleteMany({});
    await prismaService.platformSettings.deleteMany({});
    await app.close();
  });

  describe('GET /external/affiliates', () => {
    it('should fail with 401 if API key is missing', async () => {
      await request(app.getHttpServer())
        .get('/external/affiliates')
        .expect(401);
    });

    it('should fail with 401 if API key is invalid', async () => {
      await request(app.getHttpServer())
        .get('/external/affiliates')
        .set('x-api-key', 'vem_invalidkey')
        .expect(401);
    });

    it('should return paginated affiliate users', async () => {
      const res = await request(app.getHttpServer())
        .get('/external/affiliates')
        .set('x-api-key', rawApiKey)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
      // It should only fetch role = AFFILIATE, and return active, suspended, deactivated
      expect(res.body.data.length).toBe(4);

      const john = res.body.data.find((a: any) => a.email === 'john@affiliate.com');
      expect(john).toBeDefined();
      expect(john.fullName).toBe('John Doe');
      expect(john.referralCode).toBe('VEM-JD123');
      expect(john.status).toBe(UserStatus.ACTIVE);

      expect(res.body.meta).toEqual({
        total: 4,
        page: 1,
        limit: 50,
        totalPages: 1,
      });
    });

    it('should search affiliates by name (case-insensitive)', async () => {
      const res = await request(app.getHttpServer())
        .get('/external/affiliates')
        .query({ search: 'dOe' })
        .set('x-api-key', rawApiKey)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].fullName).toBe('John Doe');
    });

    it('should search affiliates by email', async () => {
      const res = await request(app.getHttpServer())
        .get('/external/affiliates')
        .query({ search: 'jane@affiliate.com' })
        .set('x-api-key', rawApiKey)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].fullName).toBe('Jane Smith');
    });

    it('should search affiliates by referral code', async () => {
      const res = await request(app.getHttpServer())
        .get('/external/affiliates')
        .query({ search: 'VEM-BJ789' })
        .set('x-api-key', rawApiKey)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].fullName).toBe('Bob Johnson');
    });

    it('should filter affiliates by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/external/affiliates')
        .query({ status: UserStatus.SUSPENDED })
        .set('x-api-key', rawApiKey)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].fullName).toBe('Jane Smith');
    });

    it('should support custom pagination limit and page', async () => {
      const res = await request(app.getHttpServer())
        .get('/external/affiliates')
        .query({ page: 2, limit: 2 })
        .set('x-api-key', rawApiKey)
        .expect(200);

      expect(res.body.data.length).toBe(2); // Since there are 4 total affiliates
      expect(res.body.meta).toEqual({
        total: 4,
        page: 2,
        limit: 2,
        totalPages: 2,
      });
    });
  });

  describe('POST /external/businesses/attach', () => {
    let affiliateId: string;
    let suspendedAffiliateId: string;

    beforeAll(async () => {
      const activeUser = await prismaService.user.findFirst({
        where: { email: 'john@affiliate.com' },
      });
      affiliateId = activeUser!.id;

      const suspendedUser = await prismaService.user.findFirst({
        where: { email: 'jane@affiliate.com' },
      });
      suspendedAffiliateId = suspendedUser!.id;
    });

    it('should fail with 401 if API key is missing', async () => {
      await request(app.getHttpServer())
        .post('/external/businesses/attach')
        .send({
          affiliateId,
          businessName: 'Acme Ventures Ltd',
          ownerName: 'Alice Smith',
          email: 'alice@acmeventures.com',
           phone: '+2348098765432',
           amount: 10000,
           planType: PlanType.PROFESSIONAL,
          address: '456 Corporate Boulevard, Lagos',
          businessType: 'Technology',
        })
        .expect(401);
    });

    it('should fail with 400 if required fields are missing', async () => {
      await request(app.getHttpServer())
        .post('/external/businesses/attach')
        .set('x-api-key', rawApiKey)
        .send({
          affiliateId,
          // Missing businessName, ownerName, email, phone
        })
        .expect(400);
    });

    it('should fail with 404 if affiliateId does not exist', async () => {
      await request(app.getHttpServer())
        .post('/external/businesses/attach')
        .set('x-api-key', rawApiKey)
        .send({
          affiliateId: 'nonexistent-uuid-123',
          businessName: 'Acme Ventures Ltd',
          ownerName: 'Alice Smith',
          email: 'alice@acmeventures.com',
           phone: '+2348098765432',
           amount: 10000,
           planType: PlanType.PROFESSIONAL,
          address: '456 Corporate Boulevard, Lagos',
          businessType: 'Technology',
        })
        .expect(404);
    });

    it('should fail with 400 if affiliate is not active', async () => {
      await request(app.getHttpServer())
        .post('/external/businesses/attach')
        .set('x-api-key', rawApiKey)
        .send({
          affiliateId: suspendedAffiliateId,
          businessName: 'Acme Ventures Ltd',
          ownerName: 'Alice Smith',
          email: 'alice@acmeventures.com',
           phone: '+2348098765432',
           amount: 10000,
           planType: PlanType.PROFESSIONAL,
          address: '456 Corporate Boulevard, Lagos',
          businessType: 'Technology',
        })
        .expect(400);
    });

    it('should successfully attach a business and trigger direct commission', async () => {
      const res = await request(app.getHttpServer())
        .post('/external/businesses/attach')
        .set('x-api-key', rawApiKey)
        .send({
          affiliateId,
          businessName: 'Acme Ventures Ltd',
          ownerName: 'Alice Smith',
          email: 'alice@acmeventures.com',
           phone: '+2348098765432',
           amount: 10000,
           planType: PlanType.PROFESSIONAL,
          address: '456 Corporate Boulevard, Lagos',
          businessType: 'Technology',
        })
        .expect(201);

      expect(res.body).toHaveProperty('businessId');
      expect(res.body.commissionTriggered).toBe(true);

      // Verify Business record in database
      const business = await prismaService.business.findUnique({
        where: { id: res.body.businessId },
      });
      expect(business).toBeDefined();
      expect(business!.businessName).toBe('Acme Ventures Ltd');
      expect(business!.email).toBe('alice@acmeventures.com');
      expect(business!.planType).toBe(PlanType.PROFESSIONAL);
      expect(business!.affiliateId).toBe(affiliateId);

      // Verify Referral count incremented
      const affiliate = await prismaService.user.findUnique({
        where: { id: affiliateId },
      });
      expect(affiliate!.referralCount).toBe(1);

      // Verify Direct Commission was created
      const commissions = await prismaService.commission.findMany({
        where: { businessId: res.body.businessId },
      });
      expect(commissions.length).toBeGreaterThan(0);
      const directComm = commissions.find((c) => c.userId === affiliateId);
      expect(directComm).toBeDefined();
       expect(Number(directComm!.amount)).toBe(1500); // 15% of 10000 plan
    });

    it('should fail with 409 Conflict if business email is already registered', async () => {
      await request(app.getHttpServer())
        .post('/external/businesses/attach')
        .set('x-api-key', rawApiKey)
        .send({
          affiliateId,
          businessName: 'Another Business',
          ownerName: 'Alice Smith',
          email: 'alice@acmeventures.com', // Duplicate email
           phone: '+2348098765432',
           amount: 10000,
           planType: PlanType.BASIC,
          address: '456 Corporate Boulevard, Lagos',
          businessType: 'Technology',
        })
        .expect(409);
    });
  });

  describe('POST /external/referrals/record', () => {
    const basePayload = {
      referralCode: 'VEM-JD123',
      businessName: 'Referral Biz Ltd',
      ownerName: 'John Doe',
      email: 'biz1@example.com',
      phone: '08012345001',
      planName: 'Professional',
      planId: '25a9b67b-63ed-4df8-b222-58d0a2e22715',
      businessId: 'edcf9de7-2397-474b-8720-412a4cb95e78',
      amountPaid: 15000,
      isFirstPayment: true,
      rate: 30,
    };

    it('should credit first-payment commission (rate x amountPaid) and create the business', async () => {
      const affiliateBefore = await prismaService.user.findUnique({
        where: { email: 'john@affiliate.com' },
      });
      const earningsBefore = Number(affiliateBefore!.pendingEarnings);
      const referralCountBefore = affiliateBefore!.referralCount;

      const res = await request(app.getHttpServer())
        .post('/external/referrals/record')
        .set('x-api-key', rawApiKey)
        .send({ ...basePayload, externalReference: 'SUB-PAY-1001' })
        .expect(201);

      expect(res.body.businessId).toBeDefined();
      expect(res.body.commissionTriggered).toBe(true);
      expect(res.body.deduplicated).toBe(false);

      const business = await prismaService.business.findUnique({
        where: { id: res.body.businessId },
      });
      expect(business).toBeDefined();
      expect(business!.planName).toBe('Professional');
      expect(business!.planId).toBe('25a9b67b-63ed-4df8-b222-58d0a2e22715');
      expect(business!.externalBusinessId).toBe('edcf9de7-2397-474b-8720-412a4cb95e78');
      expect(business!.externalReference).toBe('SUB-PAY-1001');
      expect(Number(business!.subscriptionAmount)).toBe(15000);
      // 30% of 15000 = 4500
      expect(Number(business!.commissionAmount)).toBe(4500);

      const commissions = await prismaService.commission.findMany({
        where: { businessId: res.body.businessId },
      });
      expect(commissions.length).toBe(1);
      expect(Number(commissions[0].amount)).toBe(4500);

      const affiliate = await prismaService.user.findUnique({
        where: { email: 'john@affiliate.com' },
      });
      expect(Number(affiliate!.pendingEarnings)).toBe(earningsBefore + 4500);
      expect(Number(affiliate!.totalEarnings)).toBe(earningsBefore + 4500);
      expect(affiliate!.referralCount).toBe(referralCountBefore + 1);
    });

    it('should replay the same Idempotency-Key without double-crediting', async () => {
      const payload = {
        ...basePayload,
        businessName: 'Replay Biz Ltd',
        email: 'biz2@example.com',
        businessId: 'biz-uuid-replay',
        amountPaid: 5000,
        isFirstPayment: true,
        rate: 30,
        externalReference: 'SUB-PAY-2001',
      };

      const first = await request(app.getHttpServer())
        .post('/external/referrals/record')
        .set('x-api-key', rawApiKey)
        .set('Idempotency-Key', 'affiliate-ref:SUB-PAY-2001')
        .send(payload)
        .expect(201);

      const replay = await request(app.getHttpServer())
        .post('/external/referrals/record')
        .set('x-api-key', rawApiKey)
        .set('Idempotency-Key', 'affiliate-ref:SUB-PAY-2001')
        .send(payload)
        .expect(200);

      expect(replay.body.businessId).toBe(first.body.businessId);
      expect(replay.body.deduplicated).toBe(true);

      const count = await prismaService.business.count({
        where: { email: 'biz2@example.com' },
      });
      expect(count).toBe(1);

      const commissions = await prismaService.commission.findMany({
        where: { businessId: first.body.businessId },
      });
      expect(commissions.length).toBe(1); // not double-credited
    });

    it('should dedupe on externalReference even with a fresh Idempotency-Key', async () => {
      const payload = {
        ...basePayload,
        businessName: 'Ref Dedup Ltd',
        email: 'biz3@example.com',
        businessId: 'biz-uuid-dedup',
        amountPaid: 3000,
        isFirstPayment: true,
        rate: 30,
        externalReference: 'SUB-PAY-3001',
      };

      const first = await request(app.getHttpServer())
        .post('/external/referrals/record')
        .set('x-api-key', rawApiKey)
        .send(payload)
        .expect(201);

      const replay = await request(app.getHttpServer())
        .post('/external/referrals/record')
        .set('x-api-key', rawApiKey)
        .send(payload)
        .expect(200);

      expect(replay.body.businessId).toBe(first.body.businessId);
      expect(replay.body.deduplicated).toBe(true);

      const count = await prismaService.business.count({
        where: { email: 'biz3@example.com' },
      });
      expect(count).toBe(1);
    });

    it('should credit recurring payments separately (no duplicate business, no 409)', async () => {
      const affiliateBefore = await prismaService.user.findUnique({
        where: { email: 'john@affiliate.com' },
      });
      const earningsBefore = Number(affiliateBefore!.pendingEarnings);
      const referralCountBefore = affiliateBefore!.referralCount;

      const firstPayload = {
        ...basePayload,
        businessName: 'Recurring Biz Ltd',
        email: 'biz4@example.com',
        businessId: 'biz-uuid-recurring',
        amountPaid: 10000,
        isFirstPayment: true,
        rate: 30,
        externalReference: 'SUB-PAY-4001',
      };

      const first = await request(app.getHttpServer())
        .post('/external/referrals/record')
        .set('x-api-key', rawApiKey)
        .send(firstPayload)
        .expect(201);

      // Recurring payment for the SAME business, new payment reference
      const recurring = await request(app.getHttpServer())
        .post('/external/referrals/record')
        .set('x-api-key', rawApiKey)
        .send({
          ...firstPayload,
          isFirstPayment: false,
          rate: 10,
          amountPaid: 10000,
          externalReference: 'SUB-PAY-4002',
        })
        .expect(201);

      // Same business record reused
      expect(recurring.body.businessId).toBe(first.body.businessId);

      const businesses = await prismaService.business.findMany({
        where: { email: 'biz4@example.com' },
      });
      expect(businesses.length).toBe(1); // one business, multiple payments

      const commissions = await prismaService.commission.findMany({
        where: { businessId: first.body.businessId },
      });
      // 30% of 10000 (first) + 10% of 10000 (recurring) = 3000 + 1000 = 4000
      expect(commissions.length).toBe(2);
      const total = commissions.reduce((sum, c) => sum + Number(c.amount), 0);
      expect(total).toBe(4000);

      const affiliateAfter = await prismaService.user.findUnique({
        where: { email: 'john@affiliate.com' },
      });
      expect(Number(affiliateAfter!.pendingEarnings)).toBe(earningsBefore + 4000);
      expect(affiliateAfter!.referralCount).toBe(referralCountBefore + 1); // only first payment counts as a new referral
    });

    it('should return 404 for an unknown referral code (terminal)', async () => {
      await request(app.getHttpServer())
        .post('/external/referrals/record')
        .set('x-api-key', rawApiKey)
        .send({
          ...basePayload,
          referralCode: 'VEM-UNKNOWN',
          email: 'ghost@example.com',
          businessId: 'biz-uuid-ghost',
          externalReference: 'SUB-PAY-5001',
        })
        .expect(404);
    });
  });
  describe('POST /external/withdrawals/process', () => {
    it('should create a withdrawal by affiliate email', async () => {
      const res = await request(app.getHttpServer())
        .post('/external/withdrawals/process')
        .set('x-api-key', rawApiKey)
        .send({
          email: 'carol@affiliate.com',
          amount: 20000,
          bankName: 'GTBank',
          accountNumber: '0123456789',
          accountName: 'Carol Nwosu',
          externalReference: 'VEM-WD-5001',
        })
        .expect(201);

      expect(res.body.withdrawalId).toBeDefined();
      expect(res.body.status).toBe('PENDING');
      expect(res.body.deduplicated).toBe(false);

      const withdrawal = await prismaService.withdrawal.findUnique({
        where: { id: res.body.withdrawalId },
      });
      expect(withdrawal).toBeDefined();
      expect(withdrawal!.externalReference).toBe('VEM-WD-5001');
      expect(withdrawal!.bankName).toBe('GTBank');
      expect(Number(withdrawal!.amount)).toBe(20000);
    });

    it('should dedupe a replayed withdrawal on externalReference', async () => {
      const first = await request(app.getHttpServer())
        .post('/external/withdrawals/process')
        .set('x-api-key', rawApiKey)
        .set('Idempotency-Key', 'idem-wd-6001')
        .send({
          email: 'carol@affiliate.com',
          amount: 10000,
          bankName: 'GTBank',
          accountNumber: '0123456789',
          accountName: 'Carol Nwosu',
          externalReference: 'VEM-WD-6001',
        })
        .expect(201);

      const replay = await request(app.getHttpServer())
        .post('/external/withdrawals/process')
        .set('x-api-key', rawApiKey)
        .set('Idempotency-Key', 'idem-wd-6001')
        .send({
          email: 'carol@affiliate.com',
          amount: 10000,
          bankName: 'GTBank',
          accountNumber: '0123456789',
          accountName: 'Carol Nwosu',
          externalReference: 'VEM-WD-6001',
        })
        .expect(200);

      expect(replay.body.withdrawalId).toBe(first.body.withdrawalId);
      expect(replay.body.deduplicated).toBe(true);

      const count = await prismaService.withdrawal.count({
        where: { externalReference: 'VEM-WD-6001' },
      });
      expect(count).toBe(1);
    });

    it('should return 400 when the affiliate has insufficient pending earnings', async () => {
      await request(app.getHttpServer())
        .post('/external/withdrawals/process')
        .set('x-api-key', rawApiKey)
        .send({
          email: 'carol@affiliate.com',
          amount: 999999999,
          bankName: 'GTBank',
          accountNumber: '0123456789',
          accountName: 'Carol Nwosu',
          externalReference: 'VEM-WD-7001',
        })
        .expect(400);
    });

    it('should return 404 for an unknown affiliate email', async () => {
      await request(app.getHttpServer())
        .post('/external/withdrawals/process')
        .set('x-api-key', rawApiKey)
        .send({
          email: 'nobody@affiliate.com',
          amount: 1000,
          bankName: 'GTBank',
          accountNumber: '0123456789',
          accountName: 'Nobody',
          externalReference: 'VEM-WD-7002',
        })
        .expect(404);
    });
  });
});
