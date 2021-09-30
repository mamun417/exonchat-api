import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';
import { EventsModule } from './events/events.module';

import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { RedisModule } from '@liaoliaots/nestjs-redis';

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
import { WHMCSModule } from './api/subscriber/apps/third-party/whmcs/whmcs.module';
import { FacebookModule } from './api/subscriber/apps/third-party/facebook/facebook.module'; // its with setting but not fully manages setting

import { ProfileModule } from './api/profile/profile.module';
import { AttachmentsModule } from './api/subscriber/attachments/attachments.module';
import { PasswordModule } from './api/password/password.module';
import { OfflineChatReq } from './api/subscriber/offline-chat-request/offline-chat-req.module';
import { RatingModule } from './api/rating/ratings.module';
import { ReJsonModule } from './providers/redis/rejosn/rejson.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),

        ThrottlerModule.forRoot({
            ttl: 60,
            limit: 1000,
        }),

        RedisModule.forRoot({
            closeClient: true,
            readyLog: true,
            config: [
                {
                    host: process.env.REDIS_HOST || '127.0.0.1',
                    port: parseInt(process.env.REDIS_PORT) || 6379,
                    password: process.env.REDIS_PASS || '',
                    namespace: 'ws_db',
                },
            ],
        }),
        ReJsonModule,

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

        WHMCSModule,
        FacebookModule,

        ProfileModule,

        AttachmentsModule,

        PasswordModule,

        RatingModule,

        OfflineChatReq,
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
