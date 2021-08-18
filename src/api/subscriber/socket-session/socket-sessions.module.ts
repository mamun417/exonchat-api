import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SubscribersService } from 'src/api/subscribers/subscribers.service';
import { UsersService } from 'src/api/subscriber/users/users.service';
import { SocketSessionsService } from './socket-sessions.service';
import { SocketSessionsController } from './socket-sessions.controller';

import { DataHelper } from 'src/helper/data-helper';

import { PrismaService } from 'src/prisma.service';
import { AuthModule } from 'src/auth/auth.module';
import { MailModule } from 'src/mail/mail.module';
import { EventsModule } from 'src/events/events.module';
import { SettingsService } from '../settings/settings.service';

@Module({
    imports: [EventsModule, AuthModule, HttpModule, MailModule],
    controllers: [SocketSessionsController],
    providers: [PrismaService, DataHelper, SettingsService, SocketSessionsService, SubscribersService, UsersService], // DataHelper is needed for SubscriberService
    exports: [SocketSessionsService],
})
export class SocketSessionsModule {}
