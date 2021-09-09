import { Controller, Request, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { WHMCSService } from './whmcs.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PrismaService } from 'src/prisma.service';
import { WhmcsOpenTicketDto } from './dto/whmcs-open-ticket.dto';
import { WhmcsLoginDto } from './dto/whmcs-login.dto';

@Controller('apps/whmcs')
export class WHMCSController {
    constructor(private prisma: PrismaService, private readonly WHMCSService: WHMCSService) {}

    @UseGuards(JwtAuthGuard)
    @Get('tickets')
    findAll(@Request() req: any, @Query() query: any) {
        return this.WHMCSService.findAllTickets(req, query);
    }

    // @UseGuards(JwtAuthGuard)
    // @Post('users/validate')
    // validateUser(@Request() req: any, @Body() validateUserDto: ValidateUserDto) {
    //     return this.WHMCSService.validateUser(req, validateUserDto);
    // }

    @UseGuards(JwtAuthGuard)
    @Post('tickets/open/:conv_id')
    openTicket(@Request() req: any, @Param('conv_id') convId: string, @Body() openTicketDto: WhmcsOpenTicketDto) {
        return this.WHMCSService.openTicket(req, convId, openTicketDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('tickets/:ticket_id')
    findOneTicket(@Param('ticket_id') ticketId: string, @Request() req: any) {
        return this.WHMCSService.findOneTicket(req, ticketId);
    }

    @Get('tickets/:ticket_id/notify/:sub_id')
    ticketNotification(@Param('ticket_id') ticketId: string, @Param('sub_id') subId: string, @Request() req: any) {
        return this.WHMCSService.ticketNotification(req, ticketId, subId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('client-details')
    getClientDetails(@Request() req: any, @Body() body: any) {
        return this.WHMCSService.getClientDetails(req, body);
    }

    @UseGuards(JwtAuthGuard)
    @Post('login')
    login(@Request() req: any, @Body() whmcsLoginDto: WhmcsLoginDto) {
        return this.WHMCSService.login(req, whmcsLoginDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('client-products')
    getClientsProducts(@Request() req: any, @Query() query: any) {
        return this.WHMCSService.getClientServices(req, query);
    }
}
