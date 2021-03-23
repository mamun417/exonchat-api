import { Module } from '@nestjs/common';

import { SubscribersService } from 'src/api/subscriber/subscribers/subscribers.service';
import { UsersService } from 'src/api/subscriber/users/users.service';
import { SocketSessionsService } from 'src/api/subscriber/socket-session/socket-sessions.service';

import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';

import { DataHelper } from 'src/helper/data-helper';

import { PrismaService } from 'src/prisma.service';

@Module({
    imports: [],
    controllers: [ConversationsController],
    providers: [
        PrismaService,
        DataHelper,
        SubscribersService,
        UsersService,
        SocketSessionsService,
        ConversationsService,
    ],
})
export class ConversationsModule {}
