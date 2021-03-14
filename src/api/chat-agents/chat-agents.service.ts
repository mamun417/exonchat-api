import { Injectable } from '@nestjs/common';
import { CreateChatAgentDto } from './dto/create-chat-agent.dto';
import { UpdateChatAgentDto } from './dto/update-chat-agent.dto';
import { Helper } from '../../helper/helper';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatAgent } from './entities/chat-agent.entity';
import { Repository } from 'typeorm';
import { Role } from '../role-permissions/entities/role.entity';
import { contains } from 'class-validator';

@Injectable()
export class ChatAgentsService {
    constructor(
        @InjectRepository(ChatAgent)
        private chatAgentRepository: Repository<ChatAgent>,
    ) {}

    create(createChatAgentDto: CreateChatAgentDto) {
        return 'This action adds a new chatAgent';
    }

    findAll() {
        return `This action returns all chatAgents`;
    }

    async findOne(id: string): Promise<ChatAgent> {
        return await new Helper().getSingleDataWithException(async () => {
            return await this.chatAgentRepository.findOne(id);
        }, 'chat_agents');
    }

    async update(id: string, updateChatAgentDto: UpdateChatAgentDto): Promise<ChatAgent> {
        const chatAgent = await this.findOne(id);

        chatAgent.role_id = updateChatAgentDto.role_id;
        chatAgent.subscriber_id = updateChatAgentDto.subscriber_id;
        chatAgent.email = updateChatAgentDto.email;
        chatAgent.password = updateChatAgentDto.password;
        chatAgent.active = updateChatAgentDto.active;

        return await this.chatAgentRepository.save(chatAgent);
    }

    remove(id: number) {
        return `This action removes a #${id} chatAgent`;
    }
}
