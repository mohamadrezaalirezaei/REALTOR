import { User_Type } from '@prisma/client';
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: User_Type[]) => SetMetadata('roles', roles);
