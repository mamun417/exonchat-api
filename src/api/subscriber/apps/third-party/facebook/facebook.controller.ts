import { Controller, Request, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PrismaService } from 'src/prisma.service';
import { FacebookConnectDto } from './dto/facebook-connect.dto';

@Controller('apps/facebook')
export class FacebookController {
    constructor(private prisma: PrismaService, private readonly facebookService: FacebookService) {}

    @UseGuards(JwtAuthGuard)
    @Post('connect')
    connect(@Request() req: any, @Body() facebookConnectDto: FacebookConnectDto) {
        return this.facebookService.connect(req, facebookConnectDto);
    }
}
