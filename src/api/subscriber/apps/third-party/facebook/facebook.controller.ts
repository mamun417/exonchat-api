import { Controller, Request, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PrismaService } from 'src/prisma.service';
import { FacebookConnectDto } from './dto/facebook-connect.dto';
import { FacebookPageConnectionDto } from './dto/facebook-page-connection.dto';

@Controller('apps/facebook')
export class FacebookController {
    constructor(private prisma: PrismaService, private readonly facebookService: FacebookService) {}

    @UseGuards(JwtAuthGuard)
    @Post('connect')
    connect(@Request() req: any, @Body() facebookConnectDto: FacebookConnectDto) {
        return this.facebookService.connect(req, facebookConnectDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('disconnect')
    disconnect(@Request() req: any) {
        return this.facebookService.disconnect(req);
    }

    @UseGuards(JwtAuthGuard)
    @Post('update-page-connection/:id')
    updatePageConnection(
        @Param('id') id: string,
        @Request() req: any,
        @Body() facebookPageConnectionDto: FacebookPageConnectionDto,
    ) {
        return this.facebookService.updatePageConnection(id, req, facebookPageConnectionDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('page-disconnect/:id')
    disconnectPage(@Param('id') id: string, @Request() req: any) {
        return this.facebookService.disconnectPage(id, req);
    }

    @UseGuards(JwtAuthGuard)
    @Get('accounts')
    accounts(@Request() req: any) {
        return this.facebookService.accounts(req);
    }
}
