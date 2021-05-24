import { Controller, Request, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ChatTemplateService } from './template.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { UpdateTemplateActiveStateDto } from './dto/update-template-active-state.dto';

@Controller('chat-templates')
export class ChatTemplateController {
    constructor(private readonly chatTemplateService: ChatTemplateService) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Request() req: any, @Query() query: any) {
        return this.chatTemplateService.findAll(req, query);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req: any, @Body() createTemplateDto: CreateTemplateDto) {
        return this.chatTemplateService.create(req, createTemplateDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id')
    update(@Param('id') id: string, @Request() req: any, @Body() updateTemplateDto: UpdateTemplateDto) {
        return this.chatTemplateService.update(id, req, updateTemplateDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/active-status')
    updateActiveState(
        @Param('id') id: string,
        @Request() req: any,
        @Body() updateTemplateActiveStateDto: UpdateTemplateActiveStateDto,
    ) {
        return this.chatTemplateService.updateActiveState(id, req, updateTemplateActiveStateDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    delete(@Param('id') id: string, @Request() req: any) {
        return this.chatTemplateService.delete(id, req);
    }
}
