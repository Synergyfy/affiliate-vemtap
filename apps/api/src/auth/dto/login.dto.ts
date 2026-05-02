import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  email: string; // The frontend uses 'email' field but allows email or phone. We will check both.

  @IsString()
  @IsNotEmpty()
  password: string;
}
