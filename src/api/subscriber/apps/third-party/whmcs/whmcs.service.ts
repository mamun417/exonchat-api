import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from 'src/prisma.service';

import * as _l from 'lodash';
import * as moment from 'moment';

import { EventsGateway } from 'src/events/events.gateway';
import { WhmcsOpenTicketDto } from './dto/whmcs-open-ticket.dto';

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

    async openTicket(req: any, convId: any, openTicketDto: WhmcsOpenTicketDto) {
        if (!convId) throw new HttpException(`Invalid conversation`, HttpStatus.BAD_REQUEST);

        const conv = await this.prisma.conversation.findFirst({
            where: {
                id: convId,
                closed_at: null,
                users_only: false,
                subscriber_id: req.user.data.socket_session.subscriber_id,
            },
            include: {
                conversation_sessions: { include: { socket_session: { include: { user: true } } } },
                chat_department: true,
                messages: {
                    include: { attachments: true },
                    orderBy: { created_at: 'asc' },
                    take: 100,
                },
            },
        });

        if (!conv)
            throw new HttpException(
                `Ticket open for this conversation not possible. This conversation is closed or not not found`,
                HttpStatus.CONFLICT,
            );

        const getDepartmentsParams = {
            action: 'GetSupportDepartments',
        };

        const whmcsDepartmentsRes = await this.getResponse(
            req.user.data.socket_session.subscriber_id,
            getDepartmentsParams,
        );

        const whmcsDepartments = {};

        if (whmcsDepartmentsRes.departments?.department && whmcsDepartmentsRes.departments.department.length) {
            whmcsDepartmentsRes.departments.department.forEach((d: any) => {
                whmcsDepartments[d.name] = d.id;
            });
        } else {
            throw new HttpException(`Support departments are not set in whmcs. Please notify`, HttpStatus.NOT_FOUND);
        }

        let mappedDep = Object.values(whmcsDepartments)[0];

        if (Object.keys(whmcsDepartments).includes(conv.chat_department.tag)) {
            mappedDep = whmcsDepartments[conv.chat_department.tag];
        }

        let message = this.convInfoMaker(conv);

        conv.messages.forEach((msg: any) => {
            let tempMsg = `${moment(msg.created_at).format('YYYY MM DD hh mm ss A')} : `;

            if (msg.socket_session_id) {
                const convSes = _l.find(conv.conversation_sessions, ['socket_session_id', msg.socket_session_id]);
                const ses = convSes.socket_session;
                const isAgent = !!ses.user;

                tempMsg += `${isAgent ? ses.user.email : ses.init_email} ( ${isAgent ? 'agent' : 'user'} ) `;
            } else {
                tempMsg += `(${msg.sender_type}) `;
            }

            tempMsg += `${msg.msg} `;

            if (msg.attachments && msg.attachments.length) {
                tempMsg += 'Attachments : [ ';

                msg.attachments.forEach((attch: any) => {
                    tempMsg += `${attch.original_name} `;
                });

                tempMsg += ']';
            }

            message += `${tempMsg}\n`;
        });

        const client = _l.find(conv.conversation_sessions, (cv: any) => !cv.socket_session.user);

        const openTicketParams = {
            action: 'OpenTicket',
            deptid: mappedDep,
            subject: openTicketDto.subject,
            message: message,
            markdown: true,
            name: client.socket_session.init_name,
            email: client.socket_session.init_email,
        };

        return await this.getResponse(req.user.data.socket_session.subscriber_id, openTicketParams);

        // return {};
    }

    convInfoMaker(conv) {
        let msg = '';
        const agentsCount = conv.conversation_sessions.length - 1;

        msg += `Conversation id: ${conv.id}. `;
        msg += `Created at ${moment(conv.created_at).format('YYYY MM DD hh mm ss A')}. `;
        msg += `Joined ${agentsCount} agent${agentsCount > 1 ? 's' : ''}\n`;

        return msg;
    }

    getClientDetails(req: any, body: any) {
        const queryObj: any = { action: 'GetClientsDetails', clientid: body.clientid, email: body.email };

        return this.getResponse(req.user.data.subscriber_id, queryObj);
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
