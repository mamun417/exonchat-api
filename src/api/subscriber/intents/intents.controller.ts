import { Controller, Request, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { IntentsService } from './intents.service';
import { CreateIntentDto } from './dto/create-intent.dto';
import { UpdateIntentDto } from './dto/update-intent.dto';
import { UpdateIntentActiveStateDto } from './dto/update-intent-active-state.dto';

@Controller('intents')
export class IntentsController {
    constructor(private readonly intentsService: IntentsService) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Request() req: any, @Query() query: any) {
        return this.intentsService.findAll(req, query);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req: any, @Body() createIntentDto: CreateIntentDto) {
        return this.intentsService.create(req, createIntentDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id')
    update(@Param('id') id: string, @Request() req: any, @Body() updateIntentDto: UpdateIntentDto) {
        return this.intentsService.update(id, req, updateIntentDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    delete(@Param('id') id: string, @Request() req: any) {
        return this.intentsService.delete(id, req);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.intentsService.findOne(id, req);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/active-status')
    updateActiveState(
        @Param('id') id: string,
        @Request() req: any,
        @Body() updateIntentActiveStateDto: UpdateIntentActiveStateDto,
    ) {
        return this.intentsService.updateActiveState(id, req, updateIntentActiveStateDto);
    }
}
