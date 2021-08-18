import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from 'src/prisma.service';
import { DataHelper } from 'src/helper/data-helper';
import { IntentsController } from './intents.controller';
import { IntentsService } from './intents.service';

@Module({
    imports: [HttpModule],
    controllers: [IntentsController],
    providers: [PrismaService, DataHelper, IntentsService],
})
export class IntentsModule {}
