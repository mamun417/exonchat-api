import { Controller, Request, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { WHMCSService } from './whmcs.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('whmcs/api')
export class WHMCSController {
    constructor(private readonly WHMCSService: WHMCSService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    findAll(@Request() req: any) {
        return this.WHMCSService.findAll(req);
    }
}
