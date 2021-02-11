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

@Controller('chat-clients')
export class ChatClientsController {
    constructor(private readonly chatClientsService: ChatClientsService) {}

    @Post()
    create(@Body() createChatClientDto: CreateChatClientDto) {
        return this.chatClientsService.create(createChatClientDto);
    }

    @Get()
    findAll() {
        return this.chatClientsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.chatClientsService.findOne(+id);
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
