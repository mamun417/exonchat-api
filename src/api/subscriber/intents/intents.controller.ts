import { Controller, Request, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { IntentsService } from './intents.service';
import { CreateIntentDto } from './dto/create-intent.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('intents')
export class IntentsController {
    constructor(private readonly intentsService: IntentsService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req: any, @Body() createIntentDto: CreateIntentDto) {
        return this.intentsService.create(req, createIntentDto);
    }
}
