import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateHomeDto, HomeResponseDto } from './dto/home.dto';
import { PropertyType } from '@prisma/client';
import { NotFoundError } from 'rxjs';

interface GetHomesParam {
  city?: string;
  price?: {
    gte?: number;
    lte?: number;
  };
  propertyType: PropertyType;
}

interface SendMessage {
  message: string;
}

interface createHomeParams {
  address: string;
  number_of_bedrooms: number;
  number_of_bathrooms: number;
  city: string;
  price: number;
  land_size: number;
  propertyType: PropertyType;
  images: { url: string }[];
}

interface UpdateHomeParams {
  address?: string;
  number_of_bedrooms?: number;
  number_of_bathrooms?: number;
  city?: string;
  price?: number;
  land_size?: number;
  propertyType?: PropertyType;
}
interface Data {
  message: string;
  home_id: number;
  buyer_id: number;
  realtor_id: number;
}

@Injectable()
export class HomeService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllHomes(filter: GetHomesParam): Promise<HomeResponseDto[]> {
    const homes = await this.prismaService.home.findMany({
      select: {
        id: true,
        address: true,
        city: true,
        price: true,
        propertyType: true,
        number_of_bathrooms: true,
        number_of_bedrooms: true,
        images: {
          select: {
            url: true,
          },
        },
      },
      where: filter,
    });

    if (!homes.length) {
      throw new NotFoundException();
    }
    return homes.map((home) => {
      const images = home.images.map((image) => image.url); // Extract the URLs of all images
      return new HomeResponseDto({ ...home, images });
    });
  }

  async getHomeById(paramId: number) {
    const result = await this.prismaService.home.findUnique({
      where: {
        id: paramId,
      },
    });

    return new HomeResponseDto(result);
  }

  async createHome(body: createHomeParams, userId) {
    const home = await this.prismaService.home.create({
      data: {
        address: body.address,
        number_of_bedrooms: body.number_of_bedrooms,
        number_of_bathrooms: body.number_of_bathrooms,
        city: body.city,
        price: body.price,
        land_size: body.land_size,
        propertyType: body.propertyType,
        realtor_id: userId,
      },
    });

    const homeImage = body.images.map((image) => {
      return {
        ...image,
        home_id: home.id,
      };
    });

    await this.prismaService.image.createMany({ data: homeImage });
    return new HomeResponseDto(home);
  }

  async updateHome(body: UpdateHomeParams, reqId: number) {
    const home = this.prismaService.home.findUnique({
      where: { id: reqId },
    });

    if (!home) {
      throw new NotFoundException();
    }

    const updatedHome = await this.prismaService.home.update({
      where: {
        id: reqId,
      },
      data: body,
    });

    return new HomeResponseDto(updatedHome);
  }

  async deleteHome(id: number) {
    await this.prismaService.image.deleteMany({
      where: {
        home_id: id,
      },
    });

    const home = await this.prismaService.home.findUnique({
      where: {
        id,
      },
    });
    if (!home) {
      throw new NotFoundException();
    }
    await this.prismaService.home.delete({
      where: {
        id,
      },
    });

    return 'deleted';
  }

  async getReltorByHome(id: number) {
    const home = await this.prismaService.home.findUnique({
      where: {
        id,
      },
      select: {
        realtor: {
          select: {
            name: true,
            phone: true,
            email: true,
            id: true,
          },
        },
      },
    });

    if (!home) {
      throw new NotFoundException();
    }
    return home.realtor;
  }

  async sendMessage(id: number, body: SendMessage, user) {
    const home = await this.prismaService.home.findUnique({
      where: {
        id,
      },
    });
    if (!home) {
      throw new NotFoundException();
    }

    const messageInfo = await this.prismaService.message.create({
      data: {
        message: body.message,
        home_id: id,
        buyer_id: user.id,
        realtor_id: home.realtor_id,
      },
    });
    return messageInfo;
  }

  async getHomeMessages(id: number) {
    const messages = await this.prismaService.message.findMany({
      where: {
        home_id: id,
      },
      select: {
        message: true,
        buyer: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });
    if (!messages) {
      throw new NotFoundException();
    }

    return messages;
  }
}
