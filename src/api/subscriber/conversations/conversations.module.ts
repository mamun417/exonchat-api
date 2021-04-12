import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { SocketSessionsModule } from '../socket-session/socket-sessions.module';

import { DataHelper } from 'src/helper/data-helper';

import { PrismaService } from 'src/prisma.service';

@Module({
    imports: [SocketSessionsModule],
    controllers: [ConversationsController],
    providers: [PrismaService, DataHelper, ConversationsService],
})
export class ConversationsModule {}
