import { Controller, Request, Post, Body, UseGuards } from '@nestjs/common';
import { OfflineChatReqService } from './offline-chat-req.service';
import { CreateOfflineChatReqDto } from './dto/create-offline-chat-req.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@Controller('offline-chat-request')
export class OfflineChatReqController {
    constructor(private readonly intentsService: OfflineChatReqService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req: any, @Body() createRatingDto: CreateOfflineChatReqDto) {
        return this.intentsService.create(req, createRatingDto);
    }
}
