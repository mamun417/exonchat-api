import { Controller, Request, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';

@Controller('ratings')
export class RatingsController {
    constructor(private readonly intentsService: RatingsService) {}

    @Post()
    create(@Request() req: any, @Body() createRatingDto: CreateRatingDto) {
        return this.intentsService.create(req, createRatingDto);
    }
}
