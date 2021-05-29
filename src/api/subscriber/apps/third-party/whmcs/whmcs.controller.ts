import { ValidateUserDto } from './dto/ValidateUser.dto';
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

    // @UseGuards(JwtAuthGuard)
    @Post('users/validate')
    validateUser(@Request() req: any, @Body() validateUserDto: ValidateUserDto) {
        return this.WHMCSService.validateUser(req, validateUserDto);
    }

    // @UseGuards(JwtAuthGuard)
    @Get('user/ticketes/:client_id')
    findTickets(@Param('client_id') client_id: string, @Request() req: any) {
        return this.WHMCSService.findTickets(req, client_id);
    }
}
