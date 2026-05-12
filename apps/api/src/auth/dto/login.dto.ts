import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({
    example: "john@example.com",
    description: "Email address or phone number",
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: "securePassword123",
    description: "Account password",
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
