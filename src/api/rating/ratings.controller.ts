import { Controller, Request, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('ratings')
export class RatingsController {
    constructor(private readonly intentsService: RatingsService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req: any, @Body() createRatingDto: CreateRatingDto) {
        return this.intentsService.create(req, createRatingDto);
    }
}
