import { Controller, Request, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { ReplyAiDto } from './dto/reply-ai.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) {}

    @UseGuards(JwtAuthGuard)
    @Get('reply')
    create(@Request() req: any, @Body() createMessageDto: ReplyAiDto) {
        return this.aiService.aiReply(req, createMessageDto);
    }
}
