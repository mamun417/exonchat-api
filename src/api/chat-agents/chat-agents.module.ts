import { Module } from '@nestjs/common';
import { ChatAgentsService } from './chat-agents.service';
import { ChatAgentsController } from './chat-agents.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatAgent } from './entities/chat-agent.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ChatAgent])],
    controllers: [ChatAgentsController],
    providers: [ChatAgentsService],
})
export class ChatAgentsModule {}
