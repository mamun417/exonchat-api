import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { PrismaService } from 'src/prisma.service';
import { DataHelper } from 'src/helper/data-helper';
import { ConversationsService } from '../conversations/conversations.service';
import { SocketSessionsModule } from '../socket-session/socket-sessions.module';
import { MessagesService } from './messages.service';

@Module({
    imports: [SocketSessionsModule],
    controllers: [MessagesController],
    providers: [PrismaService, DataHelper, ConversationsService, MessagesService],
})
export class MessagesModule {}
