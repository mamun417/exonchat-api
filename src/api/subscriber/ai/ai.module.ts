import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { PrismaService } from 'src/prisma.service';
import { DataHelper } from 'src/helper/data-helper';
import { SocketSessionsModule } from '../socket-session/socket-sessions.module';
import { AiService } from './ai.service';

@Module({
    imports: [SocketSessionsModule],
    controllers: [AiController],
    providers: [PrismaService, DataHelper, AiService],
})
export class MessagesModule {}
