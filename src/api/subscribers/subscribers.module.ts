import { Module } from '@nestjs/common';
import { SubscribersService } from './subscribers.service';
import { SubscribersController } from './subscribers.controller';

import { PrismaService } from '../../prisma.service';

import { DataHelper } from '../../helper/data-helper';

@Module({
    imports: [],
    controllers: [SubscribersController],
    providers: [PrismaService, DataHelper, SubscribersService],
    exports: [],
})
export class SubscribersModule {}
