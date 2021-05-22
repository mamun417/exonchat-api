import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';
import { EventsModule } from './events/events.module';

import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { AuthorizationModule } from './authorizarion/authorization.module';
import { RolePermissionModule } from './api/role-permissions/role-permission.module';

import { SubscribersModule } from './api/subscribers/subscribers.module';
import { UsersModule } from './api/subscriber/users/users.module';

import { SocketSessionsModule } from './api/subscriber/socket-session/socket-sessions.module';
import { ConversationsModule } from './api/subscriber/conversations/conversations.module';

import { MessagesModule } from './api/subscriber/messages/messages.module';
import { IntentsModule } from './api/subscriber/intents/intents.module';
import { SpeechRecognitionModule } from './api/subscriber/speech-recognition/speech.module';
import { AiModule } from './api/subscriber/ai/ai.module';
import { ChatDepartmentModule } from './api/subscriber/chat-department/department.module';
import { ChatTemplateModule } from './api/subscriber/chat-template/template.module';
import { MulterModule } from '@nestjs/platform-express';

import { SettingsModule } from './api/subscriber/settings/settings.module';
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),

        ThrottlerModule.forRoot({
            ttl: 60,
            limit: 1000,
        }),

        MulterModule.register({
            dest: './uploads',
        }),

        AuthModule,
        AuthorizationModule,
        // RolePermissionModule,

        EventsModule,

        SubscribersModule,
        UsersModule,

        SocketSessionsModule,
        ConversationsModule,

        MessagesModule,

        ChatTemplateModule,
        ChatDepartmentModule,

        IntentsModule,
        SpeechRecognitionModule,
        AiModule,

        SettingsModule,
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
