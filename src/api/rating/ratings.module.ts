import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from 'src/prisma.service';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';
import { ConversationsService } from '../subscriber/conversations/conversations.service';
import { DataHelper } from '../../helper/data-helper';
import { SocketSessionsModule } from '../subscriber/socket-session/socket-sessions.module';
import { ChatDepartmentService } from '../subscriber/chat-department/department.service';
import { UsersService } from '../subscriber/users/users.service';
import { MailModule } from '../../mail/mail.module';
import { EventsModule } from '../../events/events.module';
import { SettingsService } from '../subscriber/settings/settings.service';

@Module({
    imports: [HttpModule, SocketSessionsModule, MailModule, EventsModule],
    controllers: [RatingsController],
    providers: [
        PrismaService,
        RatingsService,
        SettingsService,
        ConversationsService,
        DataHelper,
        ChatDepartmentService,
        UsersService,
    ],
})
export class RatingModule {}
