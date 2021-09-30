import { Controller, Request, Get, Post, Body, UseGuards, Param, Res, Query } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PrismaService } from 'src/prisma.service';
import { FacebookConnectDto } from './dto/facebook-connect.dto';
import { FacebookPageConnectionDto } from './dto/facebook-page-connection.dto';
import { Response } from 'express';

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

    @Get('webhook')
    facebookWebhook(@Request() req: any, @Res() res: Response, @Query() query: any) {
        // Your verify token. Should be a random string.
        let VERIFY_TOKEN = '12345';

        // Parse the query params
        let mode = query['hub.mode'];
        let token = query['hub.verify_token'];
        let challenge = query['hub.challenge'];

        console.log(query);

        // Checks if a token and mode is in the query string of the request
        if (mode && token) {
            // Checks the mode and token sent is correct
            if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                // Responds with the challenge token from the request
                console.log('WEBHOOK_VERIFIED');
                res.status(200).send(challenge);
                // edit res call
            }
        }

        res.status(403).send();
    }

    @Post('webhook')
    async facebookWebhookPost(@Request() req: any, @Res() res: Response, @Body() body: any) {
        // console.log('called from webhook ===========');
        // console.log(body);
        // console.log('==== webhook end ======');

        await this.facebookService.facebookWebhookPost(req, body);

        res.status(200).send();
    }
}
