import { Injectable } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { Conversation } from './entities/conversation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ConversationsService {
    constructor(
        @InjectRepository(Conversation)
        private conversationRepository: Repository<Conversation>,
    ) {}

    create(createConversationDto: CreateConversationDto) {
        return 'This action adds a new conversation';
    }

    async findAll(): Promise<Conversation[]> {
        return await this.conversationRepository.find({
            relations: ['messages'],
        });
    }

    findOne(id: number) {
        return `This action returns a #${id} conversation`;
    }

    update(id: number, updateConversationDto: UpdateConversationDto) {
        return `This action updates a #${id} conversation`;
    }

    remove(id: number) {
        return `This action removes a #${id} conversation`;
    }
}
