import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { PrismaService } from 'src/prisma.service';
import { DataHelper } from 'src/helper/data-helper';
import { ConversationsService } from '../conversations/conversations.service';
import { SocketSessionsModule } from '../socket-session/socket-sessions.module';
import { MessagesService } from './messages.service';
import { ChatDepartmentService } from '../chat-department/department.service';
import { UsersService } from '../users/users.service';
import { MailModule } from 'src/mail/mail.module';
import { EventsModule } from 'src/events/events.module';
import { AttachmentsService } from '../attachments/attachments.service';
import { SettingsService } from '../settings/settings.service';

@Module({
    imports: [SocketSessionsModule, MailModule, EventsModule],
    controllers: [MessagesController],
    providers: [
        PrismaService,
        DataHelper,
        ConversationsService,
        MessagesService,
        ChatDepartmentService,
        UsersService,
        AttachmentsService,
        SettingsService,
    ],
})
export class MessagesModule {}
