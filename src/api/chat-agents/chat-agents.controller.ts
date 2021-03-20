import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { ChatAgentsService } from './chat-agents.service';
import { CreateChatAgentDto } from './dto/create-chat-agent.dto';
import { UpdateChatAgentDto } from './dto/update-chat-agent.dto';

@Controller('chat-agents')
export class ChatAgentsController {
    constructor(private readonly chatAgentsService: ChatAgentsService) {}

    // @Post()
    // create(@Body() createChatAgentDto: CreateChatAgentDto) {
    //     return this.chatAgentsService.create(createChatAgentDto);
    // }

    // @Get()
    // findAll() {
    //     return this.chatAgentsService.findAll();
    // }

    // @Get(':id')
    // findOne(@Param('id') id: string) {
    //     return this.chatAgentsService.findOne(id);
    // }

    // @Put(':id')
    // update(@Param('id') id: string, @Body() updateChatAgentDto: UpdateChatAgentDto) {
    //     return this.chatAgentsService.update(id, updateChatAgentDto);
    // }

    // @Delete(':id')
    // remove(@Param('id') id: string) {
    //     return this.chatAgentsService.remove(+id);
    // }

    // @Get(':id/permissions')
    // getUserPermissions(@Param('id') id: string) {
    //     return this.chatAgentsService.getUserPermissions(id);
    // }
}
