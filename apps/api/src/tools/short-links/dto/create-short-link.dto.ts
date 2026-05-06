import { IsString, IsNotEmpty, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShortLinkDto {
  @ApiProperty({ description: 'The custom code for the short link (e.g. "lo")', example: 'lo' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 20)
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Code can only contain letters, numbers, underscores and hyphens' })
  code: string;
}
