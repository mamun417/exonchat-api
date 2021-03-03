import { Module } from '@nestjs/common';
import { ConversationClientsService } from './conversation-clients.service';
import { ConversationClientsController } from './conversation-clients.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationClient } from './entities/conversation-client.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ConversationClient])],
    controllers: [ConversationClientsController],
    providers: [ConversationClientsService],
})
export class ConversationClientsModule {}
