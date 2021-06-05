import { HttpModule, Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { PrismaService } from 'src/prisma.service';
import { DataHelper } from 'src/helper/data-helper';
import { SocketSessionsModule } from '../socket-session/socket-sessions.module';
import { AiService } from './ai.service';
import { ConversationsService } from '../conversations/conversations.service';
import { SubscribersService } from 'src/api/subscribers/subscribers.service';
import { ChatDepartmentService } from '../chat-department/department.service';
import { UsersService } from '../users/users.service';
import { MailModule } from 'src/mail/mail.module';
import { EventsModule } from 'src/events/events.module';

@Module({
    imports: [SocketSessionsModule, HttpModule, MailModule, EventsModule],
    controllers: [AiController],
    providers: [
        PrismaService,
        DataHelper,
        AiService,
        ConversationsService,
        SubscribersService,
        ChatDepartmentService,
        UsersService,
    ],
})
export class AiModule {}
