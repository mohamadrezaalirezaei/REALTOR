import { User_Type } from '@prisma/client';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  Matches,
  IsEnum,
  IsOptional,
} from 'class-validator';

export class SignupDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @Matches(/^09[0|1|2|3][0-9]{8}$/, { message: 'phone must be a valid number' })
  phone: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(5)
  password: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  productKey?: string;
}

export class signinDto {
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class generateProductKey {
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsEnum(User_Type)
  userType: User_Type;
}
