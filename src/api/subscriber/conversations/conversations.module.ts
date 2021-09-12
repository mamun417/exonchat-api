import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { SocketSessionsModule } from '../socket-session/socket-sessions.module';

import { DataHelper } from 'src/helper/data-helper';

import { PrismaService } from 'src/prisma.service';
import { ChatDepartmentService } from '../chat-department/department.service';
import { UsersService } from '../users/users.service';
import { MailModule } from 'src/mail/mail.module';
import { EventsModule } from 'src/events/events.module';
import { SettingsService } from '../settings/settings.service';
import { AuthModule } from '../../../auth/auth.module';

@Module({
    imports: [SocketSessionsModule, EventsModule, MailModule, AuthModule],

    controllers: [ConversationsController],
    providers: [PrismaService, DataHelper, ConversationsService, ChatDepartmentService, UsersService, SettingsService],
})
export class ConversationsModule {}
