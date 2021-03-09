import { Injectable } from '@nestjs/common';
import { CreateChatAgentDto } from './dto/create-chat-agent.dto';
import { UpdateChatAgentDto } from './dto/update-chat-agent.dto';

@Injectable()
export class RolePermissionService {
    create(createChatAgentDto: CreateChatAgentDto) {
        return 'This action adds a new chatAgent';
    }

    findAll() {
        return `This action returns all chatAgents`;
    }

    findOne(id: number) {
        return `This action returns a #${id} chatAgent`;
    }

    update(id: number, updateChatAgentDto: UpdateChatAgentDto) {
        return `This action updates a #${id} chatAgent`;
    }

    remove(id: number) {
        return `This action removes a #${id} chatAgent`;
    }
}
