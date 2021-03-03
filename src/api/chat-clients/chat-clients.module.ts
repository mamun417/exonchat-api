import { Module } from '@nestjs/common';
import { ChatClientsService } from './chat-clients.service';
import { ChatClientsController } from './chat-clients.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatClient } from './entities/chat-client.entity';
import { SubscribersModule } from '../subscribers/subscribers.module';

@Module({
    imports: [TypeOrmModule.forFeature([ChatClient]), SubscribersModule],
    controllers: [ChatClientsController],
    providers: [ChatClientsService],
})
export class ChatClientsModule {}
