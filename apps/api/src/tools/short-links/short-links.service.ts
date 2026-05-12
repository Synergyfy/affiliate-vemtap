import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateShortLinkDto } from './dto/create-short-link.dto';

@Injectable()
export class ShortLinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async create(userId: string, dto: CreateShortLinkDto) {
    const existing = await this.prisma.shortLink.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('This short link code is already taken');
    }

    const shortLink = await this.prisma.shortLink.create({
      data: {
        code: dto.code,
        userId: userId,
      },
    });

    return this.formatShortLink(shortLink);
  }

  async findAll(userId: string) {
    const shortLinks = await this.prisma.shortLink.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Get click counts for each short link
    const linksWithClicks = await Promise.all(
      shortLinks.map(async (link: any) => {
        const clickCount = await this.prisma.linkClick.count({
          where: { shortLinkCode: link.code },
        });
        return {
          ...this.formatShortLink(link),
          clickCount,
        };
      }),
    );

    return linksWithClicks;
  }

  async remove(userId: string, id: string) {
    const shortLink = await this.prisma.shortLink.findUnique({
      where: { id },
    });

    if (!shortLink || shortLink.userId !== userId) {
      throw new NotFoundException('Short link not found');
    }

    return this.prisma.shortLink.delete({
      where: { id },
    });
  }

  private formatShortLink(link: any) {
    const domain = this.configService.get<string>('VEMTAP_URL') || 'https://vemtap.com';
    return {
      ...link,
      fullUrl: `${domain}/${link.code}`,
    };
  }
}
