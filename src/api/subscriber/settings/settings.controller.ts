import { Controller, Request, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { UpdateUiSettingsDto } from './dto/update-ui-settings.dto';

@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) {}

    // current not supported remove setting from user relation
    @UseGuards(JwtAuthGuard)
    @Post('ui')
    updateUISettings(@Request() req: any, @Body() updateUISettingsDto: UpdateUiSettingsDto) {
        return this.settingsService.updateUISetting(req, updateUISettingsDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('ui')
    getUISettings(@Request() req: any) {
        // return this.
    }
}
