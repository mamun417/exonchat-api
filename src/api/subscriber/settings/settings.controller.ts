import { Controller, Request, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { UpdateUiSettingsDto } from './dto/update-ui-settings.dto';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';

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
        return this.settingsService.getUISettings(req);
    }

    @UseGuards(JwtAuthGuard)
    @Post('app')
    updateAppSettings(@Request() req: any, @Body() updateAppSettingsDto: UpdateAppSettingsDto) {
        return this.settingsService.updateAppSetting(req, updateAppSettingsDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('app')
    getAppSettings(@Request() req: any) {
        return this.settingsService.getAppSettings(req);
    }
}
