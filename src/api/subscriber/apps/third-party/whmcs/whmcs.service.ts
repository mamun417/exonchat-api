import { ValidateUserDto } from './dto/ValidateUser.dto';
import { HttpException, HttpService, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

import * as _l from 'lodash';
import { EventsGateway } from 'src/events/events.gateway';

@Injectable()
export class WHMCSService {
    constructor(private prisma: PrismaService, private httpService: HttpService, private ws: EventsGateway) {}

    async findAllTickets(req: any, query: any) {
        const queryObj: any = { action: 'GetTickets' };

        if (query.email) {
            queryObj.email = query.email;
        }

        return this.getResponse(req.user.data.subscriber_id, queryObj);
    }

    // async validateUser(req: any, validateUserDto: ValidateUserDto) {
    //     const params = {
    //         action: 'ValidateLogin',
    //         email: validateUserDto.email,
    //         password2: validateUserDto.password,
    //     };

    //     return await this.getResponse(params);
    // }

    async findOneTicket(req: any, ticketId: any) {
        const params = {
            action: 'GetTicket',
            ticketid: ticketId,
        };

        return await this.getResponse(req.user.data.subscriber_id, params);
    }

    async ticketNotification(req: any, ticketId: any, subId: any) {
        const params = {
            action: 'GetTicket',
            ticketid: ticketId,
        };

        const sub = await this.prisma.subscriber.findUnique({ where: { id: subId } });

        if (!sub) {
            return {};
        }

        const ticket = await this.getResponse(sub.id, params);

        Object.keys(this.ws.userClientsInARoom)
            .filter((roomId: any) => this.ws.userClientsInARoom[roomId].sub_id === subId)
            .forEach((roomId) => {
                this.ws.server.in(roomId).emit('ec_apps_notification', {
                    app: 'whmcs',
                    type: 'ticket',
                    data: ticket,
                    reason: 'whmcs new notification',
                });
            });

        return {};
    }

    async getResponse(subId: any, dynamicFields: any) {
        const whmcsApi = await this.prisma.setting.findMany({
            where: {
                category: 'app',
                user_type: 'subscriber',
                subscriber_id: null,
                slug: { contains: 'apps_whmcs_' },
            },
            include: {
                user_settings_value: {
                    where: { subscriber_id: subId },
                },
            },
        });

        if (!whmcsApi.length) {
            throw new HttpException('WHMCS API is not active', HttpStatus.FORBIDDEN);
        }

        ['apps_whmcs_identifier_key', 'apps_whmcs_secret_key', 'apps_whmcs_enable'].forEach((tag: any) => {
            if (!_l.find(whmcsApi, ['slug', tag]) || !_l.find(whmcsApi, ['slug', tag]).user_settings_value.length) {
                throw new HttpException('WHMCS API values are empty', HttpStatus.FORBIDDEN);
            }
        });

        const params = new URLSearchParams({
            // username: '3tuMBl8jtZ6xYgiZDUqfiHpFuroPu0Ch',
            // password: 'mp9FzClGBjvdEUzaBz3wBg9IlIHuwSwW',

            username: _l.find(whmcsApi, ['slug', 'apps_whmcs_identifier_key']).user_settings_value[0].value,
            password: _l.find(whmcsApi, ['slug', 'apps_whmcs_secret_key']).user_settings_value[0].value,
            responsetype: 'json',
            ...dynamicFields,
        });

        try {
            const res: any = await this.httpService
                .post('https://dev.exonhost.com/includes/api.php', params.toString())
                .toPromise();

            return res.data;
        } catch (e) {
            console.log(e.response);

            throw new HttpException('WHMCS Bad Request', HttpStatus.BAD_REQUEST);
        }
    }
}
