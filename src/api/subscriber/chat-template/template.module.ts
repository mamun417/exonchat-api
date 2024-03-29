import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from 'src/prisma.service';
import { DataHelper } from 'src/helper/data-helper';
import { ChatTemplateController } from './template.controller';
import { ChatTemplateService } from './template.service';
import { IntentsService } from '../intents/intents.service';
import { ChatDepartmentService } from '../chat-department/department.service';
import { UsersService } from '../users/users.service';
import { MailModule } from 'src/mail/mail.module';
import { EventsModule } from 'src/events/events.module';

@Module({
    imports: [EventsModule, HttpModule, MailModule],
    controllers: [ChatTemplateController],
    providers: [PrismaService, DataHelper, ChatTemplateService, IntentsService, ChatDepartmentService, UsersService],
})
export class ChatTemplateModule {}
