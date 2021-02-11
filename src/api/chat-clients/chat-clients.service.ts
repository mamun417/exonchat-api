import { Injectable } from '@nestjs/common';
import { CreateChatClientDto } from './dto/create-chat-client.dto';
import { UpdateChatClientDto } from './dto/update-chat-client.dto';

@Injectable()
export class ChatClientsService {
    create(createChatClientDto: CreateChatClientDto) {
        return 'This action adds a new chatClient';
    }

    findAll() {
        return `This action returns all chatClients`;
    }

    findOne(id: number) {
        return `This action returns a #${id} chatClient`;
    }

    update(id: number, updateChatClientDto: UpdateChatClientDto) {
        return `This action updates a #${id} chatClient`;
    }

    remove(id: number) {
        return `This action removes a #${id} chatClient`;
    }
}
