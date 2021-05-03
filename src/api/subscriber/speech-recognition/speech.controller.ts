import { Controller, Request, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SpeechRecognitionService } from './speech.service';
import { CreateSpeechDto } from './dto/create-speech.dto';
import { UpdateSpeechDto } from './dto/update-speech.dto';
import { UpdateSpeechActiveStateDto } from './dto/update-speech-active-state.dto';

@Controller('speeches')
export class SpeechRecognitionController {
    constructor(private readonly speechRecognitionService: SpeechRecognitionService) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Request() req: any) {
        return this.speechRecognitionService.findAll(req);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req: any, @Body() createSpeechDto: CreateSpeechDto) {
        return this.speechRecognitionService.create(req, createSpeechDto);
    }

    // @UseGuards(JwtAuthGuard)
    // @Post(':id')
    // update(@Param('id') id: string, @Request() req: any, @Body() updateSpeechDto: UpdateSpeechDto) {
    //     return this.speechRecognitionService.update(id, req, updateSpeechDto);
    // }

    @UseGuards(JwtAuthGuard)
    @Post(':id/active-status')
    updateActiveState(
        @Param('id') id: string,
        @Request() req: any,
        @Body() updateSpeechActiveStateDto: UpdateSpeechActiveStateDto,
    ) {
        return this.speechRecognitionService.updateActiveState(id, req, updateSpeechActiveStateDto);
    }
}
