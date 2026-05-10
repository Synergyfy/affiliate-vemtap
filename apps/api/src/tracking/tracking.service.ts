import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotifyClickDto } from './dto/notify-click.dto';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async notifyClick(dto: NotifyClickDto) {
    const secret = this.configService.get<string>('VEMTAP_TRACKING_SECRET_TOKEN');
    
    if (dto.secret !== secret) {
      this.logger.warn(`Unauthorized click notification attempt from IP: ${dto.ip}`);
      throw new UnauthorizedException('Invalid secret token');
    }

    let userId: string | null = null;

    // Resolve user by referral code
    if (dto.referralCode) {
      const user = await this.prisma.user.findUnique({
        where: { referralCode: dto.referralCode },
        select: { id: true },
      });
      if (user) userId = user.id;
    }

    // Resolve user by short link code if user not found by referral code
    if (!userId && dto.shortLinkCode) {
      const shortLink = await this.prisma.shortLink.findUnique({
        where: { code: dto.shortLinkCode },
        select: { userId: true },
      });
      if (shortLink) userId = shortLink.userId;
    }

    // Record the click
    return this.prisma.linkClick.create({
      data: {
        referralCode: dto.referralCode,
        shortLinkCode: dto.shortLinkCode,
        userId: userId,
        ip: dto.ip,
        userAgent: dto.userAgent,
        referer: dto.referer,
        isQrScan: dto.isQrScan || false,
      },
    });
  }

  async getStats(userId: string) {
    const [clicks, scans] = await Promise.all([
      this.prisma.linkClick.count({
        where: { userId, isQrScan: false },
      }),
      this.prisma.linkClick.count({
        where: { userId, isQrScan: true },
      }),
    ]);

    return {
      linkClicks: clicks,
      qrScans: scans,
    };
  }
}
