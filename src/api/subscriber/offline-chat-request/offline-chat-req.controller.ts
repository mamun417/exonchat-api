import { Controller, Request, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { OfflineChatReqService } from './offline-chat-req.service';
import { CreateOfflineChatReqDto } from './dto/create-offline-chat-req.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@Controller('offline-chat-requests')
export class OfflineChatReqController {
    constructor(private readonly offlineChatReqService: OfflineChatReqService) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Request() req: any, @Query() query) {
        return this.offlineChatReqService.findAll(req, query);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req: any, @Body() createRatingDto: CreateOfflineChatReqDto) {
        return this.offlineChatReqService.create(req, createRatingDto);
    }
}
