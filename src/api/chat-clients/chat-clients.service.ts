import { Injectable } from '@nestjs/common';
import { CreateChatClientDto } from './dto/create-chat-client.dto';
import { UpdateChatClientDto } from './dto/update-chat-client.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { createQueryBuilder, Repository } from 'typeorm';
import { ChatClient } from './entities/chat-client.entity';
import { Subscriber } from '../subscribers/entities/subscriber.entity';

@Injectable()
export class ChatClientsService {
    constructor(
        @InjectRepository(ChatClient)
        private chatClientRepository: Repository<ChatClient>,
    ) {}

    async create(
        subscriber: Subscriber,
        createChatClientDto: CreateChatClientDto,
    ) {
        createChatClientDto.subscriber_id = subscriber.id;

        return await this.chatClientRepository.save(createChatClientDto);
    }

    async findAll(): Promise<ChatClient[]> {
        return await this.chatClientRepository.createQueryBuilder().getMany();
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

    async getChatClientsByApiKey(api_key: string): Promise<ChatClient[]> {
        return await this.chatClientRepository
            .createQueryBuilder('chat_client')
            .leftJoinAndSelect('chat_client.subscriber', 'subscriber')
            .where('subscriber.api_key = :api_key', { api_key: api_key })
            .getMany();
    }
}
