import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBusinessDto {
  @ApiProperty({ required: false, example: 'Vemtap Solutions Ltd' })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiProperty({ required: false, example: 'John Q. Owner' })
  @IsOptional()
  @IsString()
  ownerName?: string;

  @ApiProperty({ required: false, example: 'new-owner@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, example: '08099887766' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, example: '456 Innovation Drive, Lagos' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false, example: 'Tech Consulting' })
  @IsOptional()
  @IsString()
  businessType?: string;
}
