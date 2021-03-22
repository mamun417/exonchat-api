import { Module } from '@nestjs/common';

import { SubscribersService } from '../../subscribers/subscribers.service';
import { ChatAgentsService } from '../../chat-agents/chat-agents.service';
import { SocketSessionsService } from './socket-sessions.service';
import { SocketSessionsController } from './socket-sessions.controller';

import { DataHelper } from '../../../helper/data-helper';

import { PrismaService } from '../../../prisma.service';

@Module({
    imports: [],
    controllers: [SocketSessionsController],
    providers: [PrismaService, DataHelper, SocketSessionsService, SubscribersService, ChatAgentsService], // DataHelper is needed for SubscriberService
})
export class SocketSessionsModule {}
