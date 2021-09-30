import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from 'src/auth/auth.module';
import { EventsGateway } from './events.gateway';
import { PrismaService } from '../prisma.service';
import { Helper } from '../helper/helper';
import { ChatTransferService } from './listeners/chat-transfer.service';
import { ListenersHelperService } from './listeners/listeners-helper.service';
import { ReJsonModule } from '../providers/redis/rejosn/rejson.module';

@Module({
    imports: [HttpModule, AuthModule, ReJsonModule],
    providers: [EventsGateway, PrismaService, Helper, ListenersHelperService, ChatTransferService],
    exports: [EventsGateway],
})
export class EventsModule {}
