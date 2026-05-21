import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAgreementDto {
  @ApiProperty({
    description: 'HTML template for the affiliate agreement',
    example: '<h4>1. Independent Contractor Status</h4><p>...</p>',
  })
  @IsString()
  agreementTemplate: string;
}
