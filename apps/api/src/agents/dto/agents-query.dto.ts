import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class AgentsQueryDto extends PaginationDto {
  @ApiProperty({ required: false, description: 'Search by name, email, or phone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, enum: UserStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
