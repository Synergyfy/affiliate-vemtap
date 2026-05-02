import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Vemtap Production', description: 'Human-readable label for this API key' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;
}
