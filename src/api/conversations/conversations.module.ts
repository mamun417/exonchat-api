import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Conversation])],
    controllers: [ConversationsController],
    providers: [ConversationsService],
})
export class ConversationsModule {}
