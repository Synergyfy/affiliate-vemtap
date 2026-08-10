# NestJS Best Practices & Architectural Standards — Vemtap API

This guide details the architectural constraints, design patterns, and code quality standards for the `apps/api` NestJS backend.

---

## 🏛️ Layered Architecture & Single Responsibility

The NestJS API follows a strict 3-tier modular architecture:

```
[ HTTP Controller ]  ── Parses DTOs, validates input, applies Guards, delegates to Service
        │
[ Domain Service ]   ── Encapsulates core business logic, domain rules, calculation engines
        │
[ Prisma / Database] ── Handles raw persistence, transactions, and data integrity
```

### 1. Thin Controllers

Controllers MUST ONLY perform:
- Request routing and HTTP verb mapping (`@Get()`, `@Post()`, `@Patch()`).
- Input validation execution (via DTOs and `ValidationPipe`).
- Guard application (`@UseGuards(JwtAuthGuard, RolesGuard)`).
- Delegation of work to domain services.
- Header and cookie management (using `@Res({ passthrough: true })`).

```typescript
// ✅ Good: Controller delegates business logic immediately
@Controller('withdrawals')
@UseGuards(JwtAuthGuard)
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Post()
  async createRequest(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWithdrawalDto,
  ) {
    return this.withdrawalsService.requestWithdrawal(userId, dto);
  }
}
```

### 2. Fat Domain Services

All business validation, domain rules, and financial calculations MUST live in Services:

```typescript
@Injectable()
export class WithdrawalsService {
  constructor(private readonly prisma: PrismaService) {}

  async requestWithdrawal(userId: string, dto: CreateWithdrawalDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.balance.lessThan(dto.amount)) {
      throw new BadRequestException('Insufficient balance for withdrawal');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create withdrawal record and deduct balance atomically
      const withdrawal = await tx.withdrawal.create({
        data: { userId, amount: dto.amount, bankDetails: dto.bankDetails },
      });
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: dto.amount } },
      });
      return withdrawal;
    });
  }
}
```

---

## 📝 DTO & Input Validation Rules

1. **Always use `class-validator` and `class-transformer`** on DTO fields.
2. **Never use `any`** in DTO properties.
3. **Always decorate properties with Swagger `@ApiProperty()`** for API docs.

```typescript
import { IsString, IsNumber, Min, IsPositive, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWithdrawalDto {
  @ApiProperty({ description: 'Withdrawal amount in NGN', example: 5000 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @Min(1000, { message: 'Minimum withdrawal amount is ₦1,000' })
  amount: number;

  @ApiProperty({ description: 'Destination bank account number' })
  @IsString()
  accountNumber: string;

  @ApiProperty({ description: 'Destination bank code' })
  @IsString()
  bankCode: string;
}
```

---

## 🚨 Error Handling & NestJS Exception Filters

1. **Throw semantic NestJS Exceptions** (`BadRequestException`, `UnauthorizedException`, `ForbiddenException`, `NotFoundException`, `ConflictException`).
2. **Never throw raw JavaScript Error instances** (`throw new Error(...)`) in services.
3. **Use the Global Exception Filter** to ensure uniform JSON error responses:

```json
{
  "statusCode": 400,
  "message": "Minimum withdrawal amount is ₦1,000",
  "error": "Bad Request",
  "timestamp": "2026-08-10T17:55:00.000Z",
  "path": "/api/withdrawals"
}
```

---

## 🔐 Auth Guards & Role Verification

Use declarative guards and decorators on controller endpoints:

```typescript
// Roles Guard Usage
@Get('admin/payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
async getPendingPayouts() {
  return this.withdrawalsService.getPendingPayouts();
}
```

---

## 🪵 Structured Logging Standard

Use NestJS `Logger` service instead of `console.log`.

```typescript
@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

  async calculateCommission(userId: string, saleAmount: number) {
    this.logger.log(`Calculating commission for user ${userId}, sale: ₦${saleAmount}`);
    try {
      // ...
    } catch (error) {
      this.logger.error(`Failed commission calculation for ${userId}`, error.stack);
      throw error;
    }
  }
}
```

---

## 🧪 NestJS Service Testing Standard

Always mock `PrismaService` in unit tests (`*.service.spec.ts`):

```typescript
describe('WithdrawalsService', () => {
  let service: WithdrawalsService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WithdrawalsService,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
      ],
    }).compile();

    service = module.get(WithdrawalsService);
    prisma = module.get(PrismaService);
  });

  it('should throw BadRequestException if balance is insufficient', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: '1', balance: new Decimal(500) } as any);
    await expect(service.requestWithdrawal('1', { amount: 1000 } as any))
      .rejects.toThrow(BadRequestException);
  });
});
```
