import { Controller, Get, Post, Request, Res, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { LocalAuthGuard } from './auth/guards/local-auth.guard';

import { RequirePermission } from './authorizarion/permission.decorator';
import { Permission } from './authorizarion/permission.enum';

import { AuthService } from './auth/auth.service';
import { AppService } from './app.service';

@Controller()
export class AppController {
    constructor(private appService: AppService, private authService: AuthService) {}
    // @Get()
    // getHello(): string {
    //     return this.appService.getHello();
    // }
    @UseGuards(LocalAuthGuard)
    @Post('auth/login')
    async login(@Request() req: any, @Res() res: any) {
        console.log(req);

        return this.authService.login(req.user, req, res);
    }

    // @UseGuards(JwtAuthGuard)
    @RequirePermission(Permission.AGENT_ASSIGN)
    @Get('profile')
    getProfile(@Request() req: any) {
        return req.user;
    }

    @Post('auth/refresh')
    async refreshToken(@Request() req: any, @Res() res: any) {
        return this.authService.refreshToken(req, res);
    }
}
