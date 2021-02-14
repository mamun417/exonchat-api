import { Module } from '@nestjs/common';
import { ChatAgentsService } from './chat-agents.service';
import { ChatAgentsController } from './chat-agents.controller';

@Module({
    controllers: [ChatAgentsController],
    providers: [ChatAgentsService],
})
export class ChatAgentsModule {}
