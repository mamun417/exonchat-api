import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { PrismaService } from 'src/prisma.service';
import { DataHelper } from 'src/helper/data-helper';
import { UsersService } from '../users/users.service';
import { SubscribersService } from '../subscribers/subscribers.service';
import { ConversationsService } from '../conversations/conversations.service';
import { SocketSessionsService } from '../socket-session/socket-sessions.service';

@Module({
    imports: [],
    controllers: [MessagesController],
    providers: [
        PrismaService,
        DataHelper,
        UsersService,
        SubscribersService,
        ConversationsService,
        SocketSessionsService,
        MessagesService,
    ],
})
export class MessagesModule {}
