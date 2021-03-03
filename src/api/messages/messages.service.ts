import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';

@Injectable()
export class MessagesService {
    constructor(
        @InjectRepository(Message)
        private messagesRepository: Repository<Message>,
    ) {}

    async create(createMessageDto: CreateMessageDto): Promise<string> {
        return 'This action adds a new message';
    }

    async findAll(): Promise<Message[]> {
        return await this.messagesRepository.find({
            relations: ['conversation'],
        });
    }

    async findOne(id: string): Promise<Message> {
        return await this.messagesRepository.findOne(id);
    }

    async update(id: number, updateMessageDto: UpdateMessageDto) {
        return `This action updates a #${id} message`;
    }

    async remove(id: string): Promise<void> {
        await this.messagesRepository.delete(id);
    }
}
