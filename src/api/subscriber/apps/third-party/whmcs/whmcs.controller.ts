import { ValidateUserDto } from './dto/ValidateUser.dto';
import { Controller, Request, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { WHMCSService } from './whmcs.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PrismaService } from 'src/prisma.service';

@Controller('apps/whmcs')
export class WHMCSController {
    constructor(private prisma: PrismaService, private readonly WHMCSService: WHMCSService) {}

    @UseGuards(JwtAuthGuard)
    @Get('tickets')
    findAll(@Request() req: any) {
        return this.WHMCSService.findAllTickets(req);
    }

    // @UseGuards(JwtAuthGuard)
    // @Post('users/validate')
    // validateUser(@Request() req: any, @Body() validateUserDto: ValidateUserDto) {
    //     return this.WHMCSService.validateUser(req, validateUserDto);
    // }

    @UseGuards(JwtAuthGuard)
    @Get('tickets/:ticket_id')
    findOneTicket(@Param('ticket_id') ticketId: string, @Request() req: any) {
        return this.WHMCSService.findOneTicket(req, ticketId);
    }

    @Get('tickets/:ticket_id/notify/:sub_id')
    ticketNotification(@Param('ticket_id') ticketId: string, @Param('sub_id') subId: string, @Request() req: any) {
        return this.WHMCSService.ticketNotification(req, ticketId, subId);
    }
}
