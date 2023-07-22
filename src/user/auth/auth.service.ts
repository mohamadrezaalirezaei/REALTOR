import {
  ConflictException,
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { User_Type } from '@prisma/client';

interface signup {
  name: string;
  phone: string;
  password: string;
  email: string;
}
interface signin {
  password: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async signup({ email, password, name, phone }: signup, userType: User_Type) {
    const emailExist = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });
    if (emailExist) {
      throw new HttpException('Email in use! ', HttpStatus.BAD_REQUEST);
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.prismaService.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        user_type: userType,
      },
    });

    const token = this.generateToken((await user).name, (await user).id);

    return token;
  }

  async signin({ email, password }: signin) {
    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (!user) {
      throw new ConflictException();
    }
    const truePassword = await bcrypt.compare(password, user.password);

    if (!truePassword) {
      throw new HttpException('Invalid credential', HttpStatus.BAD_REQUEST);
    }

    // generate token
    const token = this.generateToken((await user).name, (await user).id);
    return token;
  }

  generateProductKey(email: string, userType: User_Type) {
    const string = `${email}-${userType}-${process.env.PRODUCT_KEY}`;
    return bcrypt.hash(string, 10);
  }

  async generateToken(name: string, id: number) {
    const token = await jwt.sign(
      {
        name,
        id,
      },
      process.env.TOKEN_KEY,
      {
        expiresIn: 360000,
      },
    );
    return token;
  }

  async getLoggedIn(user) {
    const loggedInUser = await this.prismaService.user.findUnique({
      where: {
        id: user.id,
      },
    });

    if (!loggedInUser) {
      throw new NotFoundException();
    }

    return loggedInUser;
  }
}
