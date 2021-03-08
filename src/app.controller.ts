import { Controller, Get, Post, Request, Res, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { LocalAuthGuard } from './auth/guards/local-auth.guard';
import { AuthService } from './auth/auth.service';
import { Roles } from './role-permission/roles.decorator';
import { Role } from './role-permission/role.enum';

@Controller()
export class AppController {
    constructor(private authService: AuthService) {}

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
