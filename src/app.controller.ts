import {
    Controller,
    Get,
    Request,
    Post,
    UseGuards,
    Res,
    Req,
} from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { LocalAuthGuard } from './auth/guards/local-auth.guard';
import { AuthService } from './auth/auth.service';
import { loadFiles } from 'typeorm-seeding/dist/utils/file.util';

@Controller()
export class AppController {
    constructor(private authService: AuthService) {}

    @UseGuards(LocalAuthGuard)
    @Post('auth/login')
    async login(@Request() req, @Res() res) {
        return this.authService.login(req.user, res);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
        return req.user;
    }

    @Post('auth/refresh')
    async refreshToken(@Request() req) {
        return this.authService.refreshToken(req);
    }
}
