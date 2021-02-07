import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Messages } from './message.entity';

@Injectable()
export class MessageService {
    constructor(
        @InjectRepository(Messages)
        private messagesRepository: Repository<Messages>,
    ) {}

    findAll(): Promise<Messages[]> {
        return this.messagesRepository.find();
    }

    findOne(id: string): Promise<Messages> {
        return this.messagesRepository.findOne(id);
    }

    async remove(id: string): Promise<void> {
        await this.messagesRepository.delete(id);
    }
}
