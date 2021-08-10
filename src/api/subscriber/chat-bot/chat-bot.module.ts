import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { DataHelper } from 'src/helper/data-helper';
import { ChatBotController } from './chat-bot.controller';
import { ChatBotService } from './chat-bot.service';
import { IntentsService } from '../intents/intents.service';
import { ChatDepartmentService } from '../chat-department/department.service';

@Module({
    imports: [],
    controllers: [ChatBotController],
    providers: [PrismaService, DataHelper, ChatBotService, IntentsService, ChatDepartmentService],
})
export class ChatTemplateModule {}
