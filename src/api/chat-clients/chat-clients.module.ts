import { Module } from '@nestjs/common';
import { ChatClientsService } from './chat-clients.service';
import { ChatClientsController } from './chat-clients.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatClient } from './entities/chat-client.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ChatClient])],
    controllers: [ChatClientsController],
    providers: [ChatClientsService],
})
export class ChatClientsModule {}
