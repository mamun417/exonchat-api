import { Module } from '@nestjs/common';
import { ChatAgentsService } from './chat-agents.service';
import { ChatAgentsController } from './chat-agents.controller';
import { PrismaService } from '../../prisma.service';

@Module({
    imports: [],
    controllers: [ChatAgentsController],
    providers: [PrismaService, ChatAgentsService],
    exports: [ChatAgentsService],
})
export class ChatAgentsModule {}
