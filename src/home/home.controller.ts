import {
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  Param,
  ParseIntPipe,
  Body,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { HomeService } from './home.service';
import {
  CreateHomeDto,
  HomeResponseDto,
  MessgeBody,
  UpdateHomeDto,
} from './dto/home.dto';
import { PropertyType, User_Type } from '@prisma/client';
import { User } from 'src/user/decorators/user.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  getAllHomes(
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,

    @Query('city') city?: string,
    @Query('propertyType') propertyType?: PropertyType,
  ): Promise<HomeResponseDto[]> {
    const price =
      minPrice || maxPrice
        ? {
            ...(minPrice && { gte: parseFloat(minPrice) }),
            ...(maxPrice && { lte: parseFloat(maxPrice) }),
          }
        : undefined;

    const filter = {
      ...(city && { city: city }),
      ...(propertyType && { propertyType: propertyType }),
      ...(price && { price }),
    };
    console.log(filter);
    return this.homeService.getAllHomes(filter);
  }

  @Get(':id')
  async getHomeById(@Param('id', ParseIntPipe) id: number) {
    return this.homeService.getHomeById(id);
  }

  @Post()
  @Roles(User_Type.REALTOR, User_Type.ADMIN)
  async createHome(@Body() body: CreateHomeDto, @User() user) {
    return 'created';
    // return this.homeService.createHome(body, user.id);
  }

  @Put(':id')
  async updateHome(
    @Body() body: UpdateHomeDto,
    @Param('id', ParseIntPipe) id: number,
    @User() user,
  ) {
    const realtor = await this.homeService.getReltorByHome(id);
    if (realtor.id !== user.id) {
      throw new UnauthorizedException();
    }
    return await this.homeService.updateHome(body, id);
  }

  @Delete(':id')
  async deleteHome(@Param('id', ParseIntPipe) id: number) {
    return await this.homeService.deleteHome(id);
  }

  // BUYER send message to REALTOR :
  @Post('/inquire/:id')
  @Roles(User_Type.BUYER)
  async sendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: MessgeBody,
    @User() user,
  ) {
    return await this.homeService.sendMessage(id, body, user);
  }

  //REALTOR get all messages
  @Get('/:id/messages')
  @Roles(User_Type.REALTOR, User_Type.ADMIN)
  async getHomeMessages(@Param('id', ParseIntPipe) id: number) {
    return this.homeService.getHomeMessages(id);
  }
}
