import { Controller, Request, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';

import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('conversations')
export class ConversationsController {
    constructor(private readonly conversationsService: ConversationsService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createConversationDto: CreateConversationDto, @Request() req: any) {
        return this.conversationsService.create(req, createConversationDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id')
    join(@Param('id') id: string, @Request() req: any) {
        return this.conversationsService.join(id, req);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/leave')
    leave(@Param('id') id: string, @Request() req: any) {
        return this.conversationsService.leave(id, req);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/close')
    close(@Param('id') id: string, @Request() req: any) {
        return this.conversationsService.close(id, req);
    }

    // use permission guard
    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Request() req: any) {
        return this.conversationsService.findAll(req);
    }

    @UseGuards(JwtAuthGuard)
    @Get('user-to-user/me')
    findAllUserToUserConvWithMe(@Request() req: any) {
        return this.conversationsService.findAllUserToUserConvWithMe(req);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.conversationsService.findOne(id, req);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/sessions')
    findOneWithSessions(@Param('id') id: string, @Request() req: any) {
        return this.conversationsService.findOneWithSessions(id, req);
    }

    @UseGuards(JwtAuthGuard)
    @Get('joined')
    someJoinedConvWithClient(@Request() req: any) {
        return this.conversationsService.someJoinedConvWithClient(req);
    }

    @UseGuards(JwtAuthGuard)
    @Get('joined/me')
    someJoinedMyConvWithClient(@Request() req: any) {
        return this.conversationsService.someJoinedMyConvWithClient(req);
    }

    @UseGuards(JwtAuthGuard)
    @Get('left/me')
    someLeftMyConvWithClient(@Request() req: any) {
        return this.conversationsService.someLeftMyConvWithClient(req);
    }

    @UseGuards(JwtAuthGuard)
    @Get('closed')
    someClosedConvWithClient(@Request() req: any) {
        return this.conversationsService.someClosedConvWithClient(req);
    }

    @UseGuards(JwtAuthGuard)
    @Get('closed/me')
    someClosedMyConvWithClient(@Request() req: any) {
        return this.conversationsService.someClosedMyConvWithClient(req);
    }

    @UseGuards(JwtAuthGuard)
    @Get('requests/list')
    chatRequests(@Request() req: any) {
        return this.conversationsService.chatRequests(req);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/messages')
    conversationMessages(@Param('id') id: string, @Request() req: any) {
        return this.conversationsService.conversationMessages(id, req);
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
