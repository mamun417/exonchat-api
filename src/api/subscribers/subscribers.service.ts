import { Injectable } from '@nestjs/common';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscriber } from './entities/subscriber.entity';
import { ChatClient } from '../chat-clients/entities/chat-client.entity';

@Injectable()
export class SubscribersService {
    constructor(
        @InjectRepository(Subscriber)
        private subscribeRepository: Repository<Subscriber>,
    ) {}

    async login(email: string): Promise<Subscriber | undefined> {
        return await this.subscribeRepository.findOne({
            where: {
                email: email,
            },
        });
    }

    create(createSubscriberDto: CreateSubscriberDto) {
        return 'This action adds a new subscriber';
    }

    async findAll(): Promise<Subscriber[]> {
        return await this.subscribeRepository.find();
    }

    findOne(id: number) {
        return `This action returns a #${id} subscriber`;
    }

    async getChatClientsByApiKey(api_key: string): Promise<ChatClient[]> {
        const subscriber = await this.subscribeRepository.findOne({
            where: {
                api_key,
            },
            relations: ['chat_clients'],
        });

        return subscriber['chat_clients'];
    }

    async fineOneByApiKey(api_key: string): Promise<Subscriber> {
        return await this.subscribeRepository.findOne({
            where: {
                api_key,
            },
        });
    }

    async getChatClientByApiKey(apy_key: string) {
        return await this.subscribeRepository.findOne({
            where: {
                apy_key,
            },
        });
    }

    update(id: number, updateSubscriberDto: UpdateSubscriberDto) {
        return `This action updates a #${id} subscriber`;
    }

    remove(id: number) {
        return `This action removes a #${id} subscriber`;
    }
}
