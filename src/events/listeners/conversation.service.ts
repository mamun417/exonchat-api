import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ListenersHelperService } from './listeners-helper.service';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class ConversationService {
    constructor(private listenerHelpers: ListenersHelperService, private httpService: HttpService) {}

    async initiate(
        server: Server,
        client: Socket,
        socketRes: any,
        conversations: any,
        usersRoom: any,
        clientsRoom: any,
    ) {
        const requesterSocketSession = socketRes.ses_user.socket_session;

        let conv_data = null;
        let conv_id = null;

        const requiredFields = ['message', 'chat_type'];

        if (requesterSocketSession.user_id) {
            if (socketRes.chat_type === 'live_chat') {
                requiredFields.push('department_id');
            }

            // it will fulfil the need for client_socket_session_id also. one client but for the sake of one check taking it as array
            requiredFields.push('session_ids');
        } else {
            requiredFields.push('name');
            requiredFields.push('email');
            requiredFields.push('department_id');
        }

        const requiredFieldsErrors: any = {};

        requiredFields.forEach((field: any) => {
            if (!socketRes.hasOwnProperty(field) || !socketRes[field]) {
                requiredFieldsErrors[field] = `${field} field is required`;
            }
        });

        if (Object.keys(requiredFieldsErrors).length) {
            return this.listenerHelpers.sendError(
                client,
                'ec_init_conv',
                { messages: requiredFieldsErrors },
                { cause: 'required_fields', error: requiredFieldsErrors },
            );
        }

        if (requiredFields.includes('chat_department_id')) {
            if (
                !this.listenerHelpers.usersRoomBySubscriberIdAndDepartmentId(
                    usersRoom,
                    requesterSocketSession.subscriber_id,
                    socketRes.chat_department_id,
                ).length
            ) {
                return this.listenerHelpers.sendError(
                    client,
                    'ec_init_conv',
                    'Agents are not online for this department',
                    {
                        cause: 'offline_agents',
                    },
                );
            }
        }

        try {
            const convRes: any = await this.httpService
                .post(
                    'http://localhost:3000/conversations',
                    {
                        chat_type: !requesterSocketSession.user_id ? 'live_chat' : socketRes.chat_type,
                        initiate_by: !requesterSocketSession.user_id ? 'client' : 'user',
                        session_ids: socketRes.session_ids,
                        name: socketRes.name,
                        email: socketRes.email,
                        department_id: socketRes.department_id,
                        user_info: socketRes.user_info || null,
                    },
                    { headers: { Authorization: `Bearer ${client.handshake.query.token}` } },
                )
                .toPromise();

            conv_data = convRes.data;
            conv_id = convRes.data.id;
        } catch (e) {
            const errors = this.listenerHelpers.makeErrorMessagesFromApiRes(e.response.data.message);

            return this.listenerHelpers.sendError(client, 'ec_init_conv', 'conversation initiate error', {
                error: errors,
            });
        }

        if (!conversations.hasOwnProperty(conv_id)) {
            // this.roomsInAConv[conv_id] = {
            //     conv_id: conv_id,
            //     room_ids: [roomName],
            //     client_room_id: roomName,
            //     ai_is_replying: conv_data.ai_is_replying,
            //     chat_department: conv_data.chat_department.id,
            //     routing_policy: conv_data.routing_policy,
            //     sub_id: conv_data.subscriber_id,
            //     created_at: conv_data.created_at,
            //     users_only: conv_data.users_only,
            //     chat_type: conv_data.type,
            //     last_msg_time_client: null,
            //     last_msg_time_agent: null,
            //     // dont store chat_inactive_log_handled key. cz only join can do that
            //     timing_actions_interval: setInterval(
            //         () =>
            //             this.listenersHelperService.convTimingActionsInterval(
            //                 this.server,
            //                 this.roomsInAConv,
            //                 this.userClientsInARoom,
            //                 this.normalClientsInARoom,
            //                 conv_id,
            //             ),
            //         10000,
            //     ),
            // };
        } else {
            return this.listenerHelpers.sendError(client, 'ec_init_conv', 'conv id already exists');
        }
    }
}
