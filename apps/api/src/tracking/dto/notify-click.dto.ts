import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NotifyClickDto {
  @ApiProperty({ description: 'The referral code of the affiliate' })
  @IsString()
  @IsOptional()
  referralCode?: string;

  @ApiProperty({ description: 'The custom short link code' })
  @IsString()
  @IsOptional()
  shortLinkCode?: string;

  @ApiProperty({ description: 'The secret token for authentication' })
  @IsString()
  @IsNotEmpty()
  secret: string;

  @ApiProperty({ description: 'The IP address of the user who clicked' })
  @IsString()
  @IsOptional()
  ip?: string;

  @ApiProperty({ description: 'The User Agent of the user browser' })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiProperty({ description: 'The referer URL' })
  @IsString()
  @IsOptional()
  referer?: string;

  @ApiProperty({ description: 'Whether the click came from a QR code' })
  @IsOptional()
  isQrScan?: boolean;
}
