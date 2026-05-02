# Testing — Vemtap API

## Test Strategy

| Layer | Tool | Database | Purpose |
|---|---|---|---|
| Unit | Jest + mocked Prisma | None (mocked) | Isolate and verify service/controller logic |
| E2E | Jest + Supertest | `vemtap-affiliate-test` (real Postgres) | Verify full HTTP request lifecycle |

---

## Running Tests

From `apps/api/`:

```bash
# Unit tests
pnpm exec jest

# Unit tests with coverage
pnpm exec jest --coverage

# E2E tests (requires test DB to exist)
pnpm exec jest --config ./test/jest-e2e.json --forceExit --verbose

# Full E2E (create/reset test DB then run)
pnpm test:e2e:full

# Just reset the test DB
pnpm test:db:setup
```

---

## Unit Test Conventions

Unit test files live alongside source files: `src/**/*.spec.ts`.

### Structure

```typescript
describe('MyService', () => {
  let service: MyService;
  
  // Mock every external dependency
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MyService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();
    
    service = module.get<MyService>(MyService);
  });

  afterEach(() => {
    jest.clearAllMocks(); // always reset mocks between tests
  });

  it('should do X when Y', async () => {
    mockPrismaService.user.findUnique.mockResolvedValueOnce({ id: '1' });
    const result = await service.findById('1');
    expect(result).toBeDefined();
    expect(result).not.toHaveProperty('password');
  });
});
```

### What to Test in Services

- ✅ Happy path — correct inputs return correct outputs
- ✅ Error paths — invalid input throws expected NestJS exception
- ✅ Data transformation — password stripped, fields mapped correctly
- ✅ Edge cases — null/undefined inputs, empty arrays
- ❌ Don't test Prisma internals — mock the DB and test your logic only

### What to Test in Controllers

- ✅ Correct service methods are called with correct args
- ✅ Cookies are set/cleared on the response object
- ✅ HTTP status codes are correct
- ❌ Don't re-test service logic in controller tests

---

## E2E Test Conventions

E2E test files live in `test/`: `test/*.e2e-spec.ts`.

### Setup

The global setup (`test/setup.ts`) loads `.env.test` before tests run, pointing Jest at the test database.

### Structure

```typescript
describe('FeatureController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
    await prismaService.user.deleteMany({}); // clean slate
  });

  afterAll(async () => {
    await prismaService.user.deleteMany({});
    await app.close();
  });

  it('POST /auth/login should return 200', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(200);

    expect(res.body.user.email).toBe('test@example.com');
  });
});
```

### E2E Test Rules

- Always create test data in `beforeAll` or at the start of each test.
- Always clean up in `afterAll`.
- Use `--forceExit` flag to prevent Jest from hanging on open DB connections.
- Cover both success (2xx) and failure (4xx) paths for each endpoint.
- Test cookie headers explicitly for auth endpoints.

---

## Test Database

The test database `vemtap-affiliate-test` is managed by `scripts/create-test-db.ts`:

- Connects to `localhost:5432` using credentials from `.env.test`.
- Drops the DB if it exists, then recreates it.
- Applies the current Prisma schema using `prisma db push`.

Configuration is in `test/jest-e2e.json`. The `globalSetup` entry points to `test/setup.ts` which loads `.env.test`.

---

## Mocking Patterns

### Mocking bcrypt

```typescript
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn().mockResolvedValue(true),
}));
```

### Mocking JwtService

```typescript
const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('mock-token'),
  verifyAsync: jest.fn().mockResolvedValue({ sub: '1', tokenVersion: 0 }),
};
```

### Resetting Mocks

Always call `jest.clearAllMocks()` in `afterEach` to prevent mock state leaking between tests.

---

## Test Coverage Goals

| Module | Minimum Coverage |
|---|---|
| `AuthService` | 90%+ |
| `UsersService` | 90%+ |
| Auth E2E flows | All endpoints, happy + error paths |

Run coverage report:
```bash
pnpm exec jest --coverage
```
