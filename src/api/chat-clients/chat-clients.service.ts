import { Injectable } from '@nestjs/common';
import { CreateChatClientDto } from './dto/create-chat-client.dto';
import { UpdateChatClientDto } from './dto/update-chat-client.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatClient } from './entities/chat-client.entity';
import { Message } from '../messages/entities/message.entity';

@Injectable()
export class ChatClientsService {
    constructor(
        @InjectRepository(ChatClient)
        private chatClientRepository: Repository<ChatClient>,
    ) {}

    create(createChatClientDto: CreateChatClientDto) {
        return 'This action adds a new chatClient';
    }

    async findAll(): Promise<ChatClient[]> {
        return await this.chatClientRepository.find();
    }

    async findOne(id: string): Promise<ChatClient> {
        return await this.chatClientRepository.findOne(id);
    }

    update(id: number, updateChatClientDto: UpdateChatClientDto) {
        return `This action updates a #${id} chatClient`;
    }

    remove(id: number) {
        return `This action removes a #${id} chatClient`;
    }
}
