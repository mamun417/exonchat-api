import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { ConversationClientsService } from './conversation-clients.service';
import { CreateConversationClientDto } from './dto/create-conversation-client.dto';
import { UpdateConversationClientDto } from './dto/update-conversation-client.dto';

@Controller('conversation-clients')
export class ConversationClientsController {
    constructor(private readonly conversationClientsService: ConversationClientsService) {}

    // @Post()
    // create(@Body() createConversationClientDto: CreateConversationClientDto) {
    //     return this.conversationClientsService.create(createConversationClientDto);
    // }

    // @Get()
    // findAll() {
    //     return this.conversationClientsService.findAll();
    // }

    // @Get(':id')
    // findOne(@Param('id') id: string) {
    //     return this.conversationClientsService.findOne(+id);
    // }

    // @Put(':id')
    // update(@Param('id') id: string, @Body() updateConversationClientDto: UpdateConversationClientDto) {
    //     return this.conversationClientsService.update(+id, updateConversationClientDto);
    // }

    // @Delete(':id')
    // remove(@Param('id') id: string) {
    //     return this.conversationClientsService.remove(+id);
    // }
}
