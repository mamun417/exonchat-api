import { HttpModule, Module } from '@nestjs/common';
import { SubscribersService } from './subscribers.service';
import { SubscribersController } from './subscribers.controller';

import { PrismaService } from 'src/prisma.service';

import { DataHelper } from 'src/helper/data-helper';

@Module({
    imports: [HttpModule],
    controllers: [SubscribersController],
    providers: [PrismaService, DataHelper, SubscribersService],
    exports: [SubscribersService],
})
export class SubscribersModule {}
