import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';

import { EventsModule } from './events/events.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesModule } from './api/messages/messages.module';
import { ConversationsModule } from './api/conversations/conversations.module';
import { ChatClientsModule } from './api/chat-clients/chat-clients.module';
import { SubscribersModule } from './api/subscribers/subscribers.module';
import { ChatAgentsModule } from './api/chat-agents/chat-agents.module';
import { ConversationClientsModule } from './api/conversation-clients/conversation-clients.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRoot(),
        EventsModule,
        MessagesModule,
        ConversationsModule,
        ChatClientsModule,
        SubscribersModule,
        ChatAgentsModule,
        ConversationClientsModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
