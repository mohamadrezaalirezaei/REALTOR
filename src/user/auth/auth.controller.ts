import {
  Controller,
  Post,
  Body,
  Param,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Get,
  UseGuards,
} from '@nestjs/common';
import { User_Type } from '@prisma/client';
import { generateProductKey, signinDto, SignupDto } from '../dto/auth.dto';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcryptjs';
import { User } from '../decorators/user.decorator';
import { AuthGuard } from 'src/guards/auth.guard';
import { Roles } from 'src/decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup/:userType')
  async signup(
    @Body() body: SignupDto,
    @Param('userType') usersType: User_Type,
  ) {
    if (usersType !== User_Type.BUYER) {
      if (!body.productKey) {
        throw new UnauthorizedException();
      }

      const validKey = `${body.email}-${usersType}-${process.env.PRODUCT_KEY}`;
      const isValidKey = await bcrypt.compare(validKey, body.productKey);
      console.log('yes');
      if (!isValidKey) {
        throw new UnauthorizedException();
      }
    }

    return this.authService.signup(body, usersType);
  }

  @Post('/signin')
  signin(@Body() body: signinDto) {
    return this.authService.signin(body);
  }

  @Post('/key')
  generateKey(@Body() { email, userType }: generateProductKey) {
    return this.authService.generateProductKey(email, userType);
  }

  @Get('/me')
  async LoggedInInfo(@User() user) {
    if (!user) {
      throw new UnauthorizedException();
    }
    return await this.authService.getLoggedIn(user);
  }
}
