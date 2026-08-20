import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CommunicationChannel, CommunicationTemplateStatus } from '@prisma/client';

export class CreateCommunicationTemplateDto {
  @ApiProperty({ example: 'Interested Lead – First Follow-up' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: CommunicationChannel })
  @IsEnum(CommunicationChannel)
  channel: CommunicationChannel;

  @ApiProperty({
    example: 'Hi, thanks again for your interest in VEMTAP...',
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCommunicationTemplateDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, enum: CommunicationChannel })
  @IsOptional()
  @IsEnum(CommunicationChannel)
  channel?: CommunicationChannel;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, enum: CommunicationTemplateStatus })
  @IsOptional()
  @IsEnum(CommunicationTemplateStatus)
  status?: CommunicationTemplateStatus;
}

export class TemplateStatusDto {
  @ApiProperty({ enum: CommunicationTemplateStatus })
  @IsEnum(CommunicationTemplateStatus)
  status: CommunicationTemplateStatus;
}

export class TemplateQueryDto {
  @ApiProperty({ required: false, enum: CommunicationChannel })
  @IsOptional()
  @IsEnum(CommunicationChannel)
  channel?: CommunicationChannel;

  @ApiProperty({ required: false, enum: CommunicationTemplateStatus })
  @IsOptional()
  @IsEnum(CommunicationTemplateStatus)
  status?: CommunicationTemplateStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;
}
