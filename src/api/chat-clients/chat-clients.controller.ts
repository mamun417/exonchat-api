import {
    Controller,
    Get,
    Post,
    Body,
    Put,
    Param,
    Delete,
} from '@nestjs/common';
import { ChatClientsService } from './chat-clients.service';
import { CreateChatClientDto } from './dto/create-chat-client.dto';
import { UpdateChatClientDto } from './dto/update-chat-client.dto';
import { ChatClient } from './entities/chat-client.entity';
import { Message } from '../messages/entities/message.entity';

@Controller('chat-clients')
export class ChatClientsController {
    constructor(private readonly chatClientsService: ChatClientsService) {}

    @Post()
    create(@Body() createChatClientDto: CreateChatClientDto) {
        return this.chatClientsService.create(createChatClientDto);
    }

    @Get()
    async findAll(): Promise<ChatClient[]> {
        return await this.chatClientsService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<ChatClient> {
        return await this.chatClientsService.findOne(id);
    }

    @Put(':id')
    update(
        @Param('id') id: string,
        @Body() updateChatClientDto: UpdateChatClientDto,
    ) {
        return this.chatClientsService.update(+id, updateChatClientDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.chatClientsService.remove(+id);
    }
}
