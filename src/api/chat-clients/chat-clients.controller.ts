import {
    Body,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Param,
    Post,
    Put,
} from '@nestjs/common';
import { ChatClientsService } from './chat-clients.service';
import { CreateChatClientDto } from './dto/create-chat-client.dto';
import { UpdateChatClientDto } from './dto/update-chat-client.dto';
import { ChatClient } from './entities/chat-client.entity';
import { Helper } from '../../helper/helper';

@Controller('chat-clients')
export class ChatClientsController {
    constructor(private readonly chatClientsService: ChatClientsService) {}

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<ChatClient> {
        return await new Helper().getSingleDataWithException(async () => {
            return await this.chatClientsService.findOne(id);
        });
    }

    @Post('subscriber/:api_key')
    async create(
        @Param('api_key') api_key: string,
        @Body() createChatClientDto: CreateChatClientDto,
    ) {
        return this.chatClientsService.create(api_key, createChatClientDto);
    }

    @Get()
    async findAll(): Promise<ChatClient[]> {
        return await this.chatClientsService.findAll();
    }

    @Get('subscriber/:api_key')
    async getChatClientsByApiKey(
        @Param('api_key') api_key: string,
    ): Promise<ChatClient[]> {
        return await this.chatClientsService.getChatClientsByApiKey(api_key);
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
