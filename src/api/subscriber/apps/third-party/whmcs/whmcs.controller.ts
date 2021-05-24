import { Controller, Request, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { WHMCSService } from './whmcs.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('ai')
export class WHMCSController {
    constructor(private readonly aiService: WHMCSService) {}

    @UseGuards(JwtAuthGuard)
    @Post('reply')
    findAll(@Request() req: any) {
        return this.aiService.findAll(req);
    }
}
