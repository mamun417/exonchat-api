import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { DataHelper } from 'src/helper/data-helper';
import { ChatTemplateController } from './template.controller';
import { ChatTemplateService } from './template.service';
import { IntentsService } from '../intents/intents.service';

@Module({
    imports: [],
    controllers: [ChatTemplateController],
    providers: [PrismaService, DataHelper, ChatTemplateService, IntentsService],
})
export class ChatTemplateModule {}
