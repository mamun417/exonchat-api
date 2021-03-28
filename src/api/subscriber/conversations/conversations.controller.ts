import { Controller, Request, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';

import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { JoinConversationDto } from './dto/join-conversation.dto';
import { LeaveConversationDto } from './dto/leave-conversation.dto';
import { CloseConversationDto } from './dto/close-conversation.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('conversations')
export class ConversationsController {
    constructor(private readonly conversationsService: ConversationsService) {}

    @Post()
    create(@Body() createConversationDto: CreateConversationDto) {
        return this.conversationsService.create(createConversationDto);
    }

    @Post(':id')
    join(@Param('id') id: string, @Body() joinConversationDto: JoinConversationDto) {
        return this.conversationsService.join(id, joinConversationDto);
    }

    @Post(':id/leave')
    leave(@Param('id') id: string, @Body() leaveConversationDto: LeaveConversationDto) {
        return this.conversationsService.leave(id, leaveConversationDto);
    }

    @Post(':id/close')
    close(@Param('id') id: string, @Body() closeConversationDto: CloseConversationDto) {
        return this.conversationsService.close(id, closeConversationDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/messages')
    conversationMessages(@Param('id') id: string, @Request() req: any) {
        return this.conversationsService.conversationMessages(id, req);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Request() req: any) {
        return this.conversationsService.findAll(req);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.conversationsService.findOne(id);
    }

    // @Put(':id')
    // update(@Param('id') id: string, @Body() updateConversationDto: UpdateConversationDto) {
    //     return this.conversationsService.update(+id, updateConversationDto);
    // }

    // @Delete(':id')
    // remove(@Param('id') id: string) {
    //     return this.conversationsService.remove(+id);
    // }
}
