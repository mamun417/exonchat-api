import { HttpModule, Module } from '@nestjs/common';

import { SubscribersService } from 'src/api/subscribers/subscribers.service';
import { UsersService } from 'src/api/subscriber/users/users.service';
import { SocketSessionsService } from './socket-sessions.service';
import { SocketSessionsController } from './socket-sessions.controller';

import { DataHelper } from 'src/helper/data-helper';

import { PrismaService } from 'src/prisma.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    imports: [AuthModule, HttpModule],
    controllers: [SocketSessionsController],
    providers: [PrismaService, DataHelper, SocketSessionsService, SubscribersService, UsersService], // DataHelper is needed for SubscriberService
    exports: [SocketSessionsService],
})
export class SocketSessionsModule {}
