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
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { RolePermissionModule } from './api/role-permissions/role-permission.module';
import { AuthorizationModule } from './authorizarion/authorization.module';

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
        ThrottlerModule.forRoot({
            ttl: 60,
            limit: 1000,
        }),
        AuthModule,
        AuthorizationModule,
        RolePermissionModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule {}
