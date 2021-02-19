import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
} from '@nestjs/common';
import { ChatClientsService } from './chat-clients.service';
import { CreateChatClientDto } from './dto/create-chat-client.dto';
import { UpdateChatClientDto } from './dto/update-chat-client.dto';
import { ChatClient } from './entities/chat-client.entity';
import { SubscribersService } from '../subscribers/subscribers.service';

@Controller('chat-clients')
export class ChatClientsController {
    constructor(
        private readonly chatClientsService: ChatClientsService,
        private readonly subscribersService: SubscribersService,
    ) {}

    @Post('subscriber/:api_key')
    async create(
        @Param('api_key') api_key: string,
        @Body() createChatClientDto: CreateChatClientDto,
    ) {
        const subscriber = await this.subscribersService.fineOneByApiKey(
            api_key,
        );
        // dtp not working
        return this.chatClientsService.create(subscriber, createChatClientDto);
    }

    @Get()
    async findAll(): Promise<ChatClient[]> {
        return await this.chatClientsService.findAll();
    }

    @Get('subscriber/:api_key')
    async getChatClientsByApiKey(
        @Param('api_key') api_key: string,
    ): Promise<ChatClient[]> {
        return await this.subscribersService.getChatClientsByApiKey(api_key);
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
