import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignInDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;
}

export class SignUpDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
    };
    token: string;
    refreshToken?: string;
  };
}