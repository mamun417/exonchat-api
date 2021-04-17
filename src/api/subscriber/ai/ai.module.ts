import { HttpModule, Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { PrismaService } from 'src/prisma.service';
import { DataHelper } from 'src/helper/data-helper';
import { SocketSessionsModule } from '../socket-session/socket-sessions.module';
import { AiService } from './ai.service';
import { ConversationsService } from '../conversations/conversations.service';

@Module({
    imports: [SocketSessionsModule, HttpModule],
    controllers: [AiController],
    providers: [PrismaService, DataHelper, AiService, ConversationsService],
})
export class AiModule {}
