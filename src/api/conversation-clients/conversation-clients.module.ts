import { Module } from '@nestjs/common';
import { ConversationClientsService } from './conversation-clients.service';
import { ConversationClientsController } from './conversation-clients.controller';

@Module({
    imports: [],
    controllers: [ConversationClientsController],
    providers: [ConversationClientsService],
})
export class ConversationClientsModule {}
