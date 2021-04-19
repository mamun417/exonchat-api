import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { RequireRole } from './roles.decorator';
import { Role } from './role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cats')
export class CatsController {
    @Post()
    @UseGuards(JwtAuthGuard)
    @RequireRole(Role.Admin)
    create(@Body() body) {
        return body;
    }
}
