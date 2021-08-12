import { Controller, Request, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ChatBotService } from './chat-bot.service';
import { CreateChatBotDto } from './dto/create-chat-bot.dto';
import { UpdateChatBotDto } from './dto/update-chat-bot.dto';
import { UpdateChatBotActiveStateDto } from './dto/update-chat-bot-active-state.dto';
import { CreateChatBotItemDto } from './dto/create-chat-bot-item.dto';
import { UpdateChatBotItemDto } from './dto/update-chat-bot-item.dto';

@Controller('chat-templates')
export class ChatBotController {
    constructor(private readonly chatBotService: ChatBotService) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Request() req: any, @Query() query: any) {
        return this.chatBotService.findAll(req, query);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req: any, @Body() createChatBotDto: CreateChatBotDto) {
        return this.chatBotService.create(req, createChatBotDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    createBotItem(@Request() req: any, @Body() createChatBotItemDto: CreateChatBotItemDto) {
        return this.chatBotService.createBotItem(req, createChatBotItemDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id')
    update(@Param('id') id: string, @Request() req: any, @Body() updateChatBotDto: UpdateChatBotDto) {
        return this.chatBotService.update(id, req, updateChatBotDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('bot-item/:id')
    updateBotItem(@Param('id') id: string, @Request() req: any, @Body() updateChatBotItemDto: UpdateChatBotItemDto) {
        return this.chatBotService.updateBotItem(id, req, updateChatBotItemDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/active-status')
    updateActiveState(
        @Param('id') id: string,
        @Request() req: any,
        @Body() updateChatBotActiveStateDto: UpdateChatBotActiveStateDto,
    ) {
        return this.chatBotService.updateActiveState(id, req, updateChatBotActiveStateDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('bot-item/:id/active-status')
    updateBotItemActiveState(
        @Param('id') id: string,
        @Request() req: any,
        @Body() updateChatBotActiveStateDto: UpdateChatBotActiveStateDto, // UpdateChatBotActiveStateDto same for both
    ) {
        return this.chatBotService.updateBotItemActiveState(id, req, updateChatBotActiveStateDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    delete(@Param('id') id: string, @Request() req: any) {
        return this.chatBotService.delete(id, req);
    }
}
