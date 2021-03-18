import { Controller, Get, Post, Request, Res, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { LocalAuthGuard } from './auth/guards/local-auth.guard';
import { AuthService } from './auth/auth.service';
import { Roles } from './authorizarion/roles.decorator';
import { Role } from './authorizarion/role.enum';

@Controller()
export class AppController {
    constructor(private appService: AppService, private authService: AuthService) {}

    @Get()
    getHello(): string {
        return this.appService.getHello();
    }

    @UseGuards(LocalAuthGuard)
    @Post('auth/login')
    async login(@Request() req, @Res() res) {
        return this.authService.login(req.user, res);
    }

    @Roles(Role.Admin)
    @Get('profile')
    getProfile(@Request() req) {
        return req.user;
    }

    @Post('auth/refresh')
    async refreshToken(@Request() req, @Res() res) {
        return this.authService.refreshToken(req, res);
    }
}
