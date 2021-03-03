import { Injectable } from '@nestjs/common';
import { CreateChatClientDto } from './dto/create-chat-client.dto';
import { UpdateChatClientDto } from './dto/update-chat-client.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatClient } from './entities/chat-client.entity';
import { Subscriber } from '../subscribers/entities/subscriber.entity';
import { Message } from '../messages/entities/message.entity';
import { SubscribersService } from '../subscribers/subscribers.service';

@Injectable()
export class ChatClientsService {
    constructor(
        @InjectRepository(ChatClient)
        private chatClientRepository: Repository<ChatClient>,
        private readonly subscribersService: SubscribersService,
    ) {}

    async create(api_key: string, createChatClientDto: CreateChatClientDto) {
        const subscriber = await this.subscribersService.fineOneByApiKey(
            api_key,
        );

        createChatClientDto.subscriber_id = subscriber.id;

        return await this.chatClientRepository.save(createChatClientDto);
    }

    async findAll(): Promise<ChatClient[]> {
        return await this.chatClientRepository.createQueryBuilder().getMany();
    }

    async findOne(id: string) {
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
            .leftJoin('chat_client.subscriber', 'subscriber')
            .where('subscriber.api_key = :api_key', { api_key: api_key })
            .getMany();
    }
}
