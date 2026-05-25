import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignAgreementDto {
  @ApiProperty({
    description: 'The version of the agreement being signed',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  version: number;
}
