import { UseGuards } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
    MessageBody,
    ConnectedSocket,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

import * as _ from 'lodash';
import * as moment from 'moment';

import { WsJwtGuard } from 'src/auth/guards/ws-auth.guard';
import { AuthService } from 'src/auth/auth.service';
import { PrismaService } from '../prisma.service';
import { Helper } from '../helper/helper';
import { ChatTransferService } from './listeners/chat-transfer.service';
import { ListenersHelperService } from './listeners/listeners-helper.service';

@WebSocketGateway({
    serveClient: false,
    cors: {
        origin: [process.env.CLIENT_URL],
        methods: ['GET', 'POST'],
        allowedHeaders: ['Accept', 'Content-Type', 'Access-Control-Allow-Headers', 'Authorization', 'X-Requested-With'],
        preflightContinue: true,
        credentials: true,
    },
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private httpService: HttpService,
        private authService: AuthService,
        private prisma: PrismaService,
        private helper: Helper,
        private listenersHelperService: ListenersHelperService,
        private chatTransferService: ChatTransferService,
    ) {}

    @WebSocketServer()
    server: Server;

    // server is eq to socket.io's io
    // client|Socket is eq to socket.io's socket

    // client is webchat user
    // user = user/agent

    // verified token data has in data.ses_user
    // if user then data.ses_user contains user info then socket_session
    // in socket_session has session info.
    // you will see that in some places not containing data.ses_ser.socket_session.subscriber_id
    // but only data.ses_user.subscriber_id. it's only for user end. if you don't get the data that means
    // your ses is not for user

    public userClientsInARoom: any = {}; // users/agents {ses_id: {socket_client_ids: [], sub_id: subscriber_id, chat_departments: [...ids], online_status: 'online/offline/invisible'}}
    private normalClientsInARoom: any = {}; // normal clients from site web-chat {ses_id: {socket_client_ids: [], sub_id: subscriber_id, chat_status: active/inactive}}

    convObjSkeleton = {
        conv_id: {
            room_ids: [],
            client_room_id: 'client_ses_id', // its imp. cz if client goes offline normalClientsInARoom does not contain the session
            sub_id: 'subscriber_id',
            users_only: 'bool',
            ai_is_replying: 'bool',
            chat_department: '', // chat_department id
            routing_policy: 'manual/...',
            notify_again: 'bool',
            notify_to: 'ses_id',
            last_msg_time_agent: 'null | 0 | timestamp', // null = no join, 0 = join bt no msg, if null can inactive check
            last_msg_time_client: 'null | 0 | timestamp',
            chat_inactive_log_handled: 'bool',
            timing_actions_interval: 'null | interval',
        },
    };
    // if notify_to that means it's only for this agent. it will also maintain for transfer chat
    // if a browser reload happens then send the agents departmental chat by that notify_to. if no notify_to then also it's for him
    private roomsInAConv: any = {};

    usersRoomBySubscriberId(subscriberId: any, onlineStatus = true) {
        return Object.keys(this.userClientsInARoom).filter(
            (roomId: any) =>
                this.userClientsInARoom[roomId].sub_id === subscriberId &&
                (!onlineStatus || (onlineStatus && this.userClientsInARoom[roomId].online_status === 'online')),
        );
    }

    // if onlineStatus true only true online users will filter else all other
    usersRoom(socketRes: any, onlineStatus = true) {
        return this.usersRoomBySubscriberId(socketRes.ses_user.socket_session.subscriber_id, onlineStatus);
    }

    // send to a tab/socket client instance
    sendToSocketClient(client: any, emitName: string, emitObj: any) {
        this.server.to(client.id).emit(emitName, emitObj);
    }

    // send to a room
    sendToSocketRoom(roomId: string, emitName: string, emitObj: any) {
        this.server.in(roomId).emit(emitName, emitObj);
    }

    // send to rooms
    sendToSocketRooms(roomsId: any, emitName: string, emitObj: any) {
        roomsId.forEach((roomId: any) => {
            this.sendToSocketRoom(roomId, emitName, emitObj);
        });
    }

    sendToAllWithAConvClient(subscriberId: string, ConversationId: string, emitName: string, emitObj: any) {
        const rooms = this.usersRoomBySubscriberId(subscriberId, false);

        const clientRoom = this.roomsInAConv[ConversationId]?.client_room_id;

        if (clientRoom) {
            rooms.push(clientRoom);
        }

        this.sendToSocketRooms(rooms, emitName, emitObj);
    }

    sendToAllUsers(
        socketRes: any,
        onlyOnlineUsers = true,
        emitName: any,
        emitObj: any,
        sendToConvClient = false,
        conv: any = {},
    ) {
        this.sendToSocketRooms(this.usersRoom(socketRes, onlyOnlineUsers), emitName, emitObj);

        if (sendToConvClient && conv) {
            this.sendToConvClient(conv, socketRes, emitName, emitObj);
        }
    }

    sendToConvClient(conv: any, socketRes: any, emitName: any, emitObj: any) {
        this.sendToSocketRoom(conv.client_room_id, emitName, emitObj);
    }

    sendToAllUsersWithout(socketRes: any, onlyOnlineUsers = true, exceptRoomIds = [], emitName: any, emitObj: any) {
        this.usersRoom(socketRes, onlyOnlineUsers).forEach((roomId: any) => {
            if (!exceptRoomIds.includes(roomId)) this.sendToSocketRoom(roomId, emitName, emitObj);
        });
    }

    convPolicyIsManual(convObj: any) {
        return convObj && (!convObj.routing_policy || convObj.routing_policy === 'manual');
    }

    async roundRobinSend(client: any, socketRes: any, resObj: any, roomIds: any, convsValues: any) {
        const joinedMapperCount = { room_id: '', count: 999 };

        roomIds.forEach((roomId) => {
            const count = convsValues.filter((conv: any) => {
                return conv.room_ids.includes(roomId);
            }).length;

            if (count < joinedMapperCount.count) {
                joinedMapperCount.room_id = roomId;
                joinedMapperCount.count = count;
            }
        });

        if (joinedMapperCount.room_id && joinedMapperCount.count < 3) {
            // send only to this room with notify
            this.roomsInAConv[resObj.conv_id].notify_to = joinedMapperCount.room_id;

            this.sendToSocketRoom(joinedMapperCount.room_id, 'ec_conv_initiated_from_client', {
                data: { ...resObj, notify: true, join: true },
            });

            // await this.updateConversationNotifyToValueInDB(client, resObj.conv_id, joinedMapperCount.room_id);

            this.sendToAllUsersWithout(socketRes, true, [joinedMapperCount.room_id], 'ec_conv_initiated_from_client', {
                data: { ...resObj, notify: false },
            });
        } else {
            // if no agents are free then send to these agents with notify
            // and send to all other to know that a conv initiated
            this.sendToSocketRooms(roomIds, 'ec_conv_initiated_from_client', {
                data: { ...resObj, notify: true },
            });

            this.sendToAllUsersWithout(socketRes, true, roomIds, 'ec_conv_initiated_from_client', {
                data: { ...resObj, notify: false },
            });
        }
    }

    clientConvQueuePosition(convId: any, sub_id: any) {
        const position = _.findIndex(
            _.sortBy(
                Object.values(this.roomsInAConv).filter((conv: any) => {
                    // later check room_ids 1 is client
                    return (
                        !conv.users_only &&
                        conv.chat_type === 'live_chat' &&
                        conv.sub_id === sub_id &&
                        conv.room_ids.length === 1
                    );
                }),
                [(conv) => moment(conv.created_at).format('x')],
            ),
            ['conv_id', convId],
        );

        return position === -1 ? null : position + 1;
    }

    // I think no need for nw
    // async updateConversationNotifyToValueInDB(client: any, convId: string, sesId: string) {
    //     try {
    //         const convRes: any = await this.httpService
    //             .post(
    //                 `http://localhost:3000/conversations/${convId}/other_info`,
    //                 {
    //                     notify_to_value: sesId,
    //                 },
    //                 { headers: { Authorization: `Bearer ${client.handshake.query.token}` } },
    //             )
    //             .toPromise();
    //     } catch (e) {}
    // }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_get_logged_users') // get users list when needed
    async usersOnline(@MessageBody() socketRes: any, @ConnectedSocket() client: Socket): Promise<number> {
        this.sendToSocketClient(client, 'ec_logged_users_res', {
            users: this.usersRoom(socketRes, false).map((roomId: any) => {
                return { ses_id: roomId, online_status: this.userClientsInARoom[roomId].online_status };
            }), // true or false check first
        });

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_updated_socket_room_info') // update users status when needed
    async updateUsersStatus(@MessageBody() socketRes: any, @ConnectedSocket() client: Socket): Promise<number> {
        const roomName = socketRes.ses_user.socket_session.id;

        const dataSendObj: any = {};

        // body = {
        //      online_status = ['online', 'offline', 'invisible'], for user
        //      chat_status = ['active', 'inactive'] for client
        //      status_for = client/user
        // }

        if (
            socketRes.status_for !== 'client' &&
            socketRes.online_status &&
            ['online', 'offline', 'invisible'].includes(socketRes.online_status)
        ) {
            this.userClientsInARoom[roomName].online_status = socketRes.online_status;

            dataSendObj.online_status = socketRes.online_status;
        }

        if (
            socketRes.status_for === 'client' &&
            socketRes.chat_status &&
            ['active', 'inactive'].includes(socketRes.chat_status)
        ) {
            this.normalClientsInARoom[roomName].chat_status = socketRes.chat_status;

            // if emit needed then make dataSendObj
        }

        if (Object.keys(dataSendObj).length) {
            if (socketRes.status_for === 'user') {
                // send to all users
                this.sendToSocketRooms(this.usersRoom(socketRes, false), 'ec_updated_socket_room_info_res', {
                    action: 'online_status',
                    type: 'user',
                    ses_id: roomName,
                    data: dataSendObj,
                });
            } else {
                // no need to send to client for now
            }
        } else {
            // send error
        }

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_get_client_ses_id_status')
    async getClientsSesIdStatus(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        const roomName = data.ses_user.socket_session.id;

        let status = 'inactive';

        if (data.hasOwnProperty('client_ses_id') && data.client_ses_id) {
            if (
                this.normalClientsInARoom.hasOwnProperty(data.client_ses_id) &&
                this.normalClientsInARoom[data.client_ses_id].socket_client_ids.length &&
                this.normalClientsInARoom[data.client_ses_id].sub_id === data.ses_user.subscriber_id &&
                (!this.normalClientsInARoom[data.client_ses_id].hasOwnProperty('chat_status') ||
                    this.normalClientsInARoom[data.client_ses_id].chat_status === 'active')
            ) {
                status = 'active';
            }

            this.server.in(roomName).emit('ec_get_client_ses_id_status_res', {
                ses_id: data.client_ses_id,
                status: status,
            });
        }

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_page_visit_info_from_client')
    async pageVisitInfoFromClient(@MessageBody() socketRes: any, @ConnectedSocket() client: Socket): Promise<number> {
        this.sendToSocketRooms(this.usersRoom(socketRes, false), 'ec_page_visit_info_from_client', {
            page_data: socketRes.page_data,
            sent_at: socketRes.sent_at,
            visiting: socketRes.visiting,
            ses_id: socketRes.ses_user.socket_session.id,
            ses_info: socketRes.ses_user.socket_session,
        });

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_departments_online_status')
    async departmentsOnlineStatus(@MessageBody() socketRes: any, @ConnectedSocket() client: Socket): Promise<number> {
        let onlineDepartments = [];

        Object.values(this.userClientsInARoom).forEach((userClient: any) => {
            if (
                userClient.sub_id === socketRes.ses_user.socket_session.subscriber_id &&
                userClient.online_status === 'online'
            ) {
                onlineDepartments = _.union(onlineDepartments, userClient.chat_departments); // merge unique
            }
        });

        // you will get only the online departments for now
        this.sendToSocketClient(client, 'ec_departments_online_status_res', {
            departments: onlineDepartments,
        });

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_conv_queue_position')
    async convQueuePosition(@MessageBody() socketRes: any, @ConnectedSocket() client: Socket): Promise<number> {
        if (!socketRes.conv_id) return;

        const queue_position = this.clientConvQueuePosition(
            socketRes.conv_id,
            socketRes.ses_user.socket_session.subscriber_id,
        );

        this.sendToSocketClient(client, 'ec_conv_queue_position_res', {
            conv_id: socketRes.conv_id,
            queue_position: queue_position,
            position_for: 'client',
        });

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_init_conv_from_user')
    async init_conversation_from_user(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<any> {
        let conv_data = null;
        let conv_id = null;

        if (!data.ses_ids || !data.chat_type) {
            this.sendError(client, 'ec_init_conv_from_user', 'invalid params');
            return;
        }

        try {
            const convRes: any = await this.httpService
                .post(
                    'http://localhost:3000/conversations',
                    {
                        chat_type: data.chat_type,
                        ses_ids: data.ses_ids,
                    },
                    { headers: { Authorization: `Bearer ${client.handshake.query.token}` } },
                )
                .toPromise();

            conv_data = convRes.data;
            conv_id = convRes.data.id;
        } catch (e) {
            return this.sendError(client, 'ec_init_conv_from_user', e.response.data);
        }

        const roomName = data.ses_user.socket_session.id;

        if (!this.roomsInAConv.hasOwnProperty(conv_id)) {
            this.roomsInAConv[conv_id] = { room_ids: [roomName, ...data.ses_ids], sub_id: conv_data.subscriber_id };

            if (data.users_only) {
                this.roomsInAConv[conv_id].users_only = true;
            }
        } else {
            this.server.in(roomName).emit('ec_conv_initiated_from_user', {
                data: {
                    conv_id,
                    conv_data,
                },
                type: 'warning',
                status: 'conflict',
                reason: 'conv already exists in socket',
            });

            return;
        }

        this.server.in(roomName).emit('ec_conv_initiated_from_user', {
            data: {
                conv_id,
                conv_data,
            },
            status: 'success',
        });

        // console.log('Rooms In Conversations => ', this.roomsInAConv);

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_init_conv_from_client')
    async init_conversation_from_client(
        @MessageBody() socketRes: any,
        @ConnectedSocket() client: Socket,
    ): Promise<any> {
        let conv_data = null;
        let conv_id = null;

        const requiredFields = ['name', 'email', 'department', 'message'];

        const requiredFieldsErrors: any = {};

        requiredFields.forEach((field: any) => {
            if (!socketRes.hasOwnProperty(field) || !socketRes[field]) {
                requiredFieldsErrors[field] = `${field} field is required`;
            }
        });

        if (Object.keys(requiredFieldsErrors).length) {
            return this.sendError(
                client,
                'ec_init_conv_from_client',
                { messages: requiredFieldsErrors },
                { cause: 'required_field' },
            );
        }

        const matchedDepartmentalAgents = this.usersRoom(socketRes).filter((roomId: any) => {
            return this.userClientsInARoom[roomId].chat_departments?.includes(socketRes.department_id);
        });

        if (!matchedDepartmentalAgents.length) {
            return this.sendError(client, 'ec_init_conv_from_client', 'Agents are not online for this department', {
                cause: 'offline_agent',
            });
        }

        try {
            const convRes: any = await this.httpService
                .post(
                    'http://localhost:3000/conversations',
                    {
                        chat_type: 'live_chat',
                        name: socketRes.name,
                        email: socketRes.email,
                        department: socketRes.department,
                        user_info: socketRes.user_info,
                    },
                    { headers: { Authorization: `Bearer ${client.handshake.query.token}` } },
                )
                .toPromise();

            conv_data = convRes.data;
            conv_id = convRes.data.id;
        } catch (e) {
            const messages = this.helper.makeErrorMessages(e.response.data.message);

            return this.sendError(
                client,
                'ec_init_conv_from_client',
                { messages },
                {
                    cause: 'socket_error_ec_init_conv_from_client',
                },
            );
        }

        const roomName = socketRes.ses_user.socket_session.id;

        if (!this.roomsInAConv.hasOwnProperty(conv_id)) {
            this.roomsInAConv[conv_id] = {
                conv_id: conv_id,
                room_ids: [roomName],
                client_room_id: roomName,
                ai_is_replying: conv_data.ai_is_replying,
                chat_department: conv_data.chat_department.id,
                routing_policy: conv_data.routing_policy,
                sub_id: conv_data.subscriber_id,
                created_at: conv_data.created_at,
                users_only: conv_data.users_only,
                chat_type: conv_data.type,
                last_msg_time_client: null,
                last_msg_time_agent: null,
                // dont store chat_inactive_log_handled key. cz only join can do that
                timing_actions_interval: setInterval(() => this.convTimingActionsInterval(conv_id), 10000),
            };
        } else {
            return this.sendError(client, 'ec_init_conv_from_client', 'conv id already exists');
        }

        const queue_position = this.clientConvQueuePosition(conv_id, socketRes.ses_user.socket_session.subscriber_id);

        const sendRes = {
            conv_data,
            conv_id,
            queue_position: queue_position,
        };

        if (this.convPolicyIsManual(conv_data)) {
            // send online users only
            this.sendToSocketRooms(matchedDepartmentalAgents, 'ec_conv_initiated_from_client', {
                data: { ...sendRes, notify: true },
            });

            this.sendToAllUsersWithout(socketRes, false, matchedDepartmentalAgents, 'ec_conv_initiated_from_client', {
                data: { ...sendRes, notify: false },
            });
        } else {
            // we are calling this.convIsBasicNotifiable(data) for safety. if changes then it will safeguard

            // get own companies clients conversation
            const subIdMatchedConvs = Object.values(this.roomsInAConv).filter((conv: any) => {
                return conv.sub_id === socketRes.ses_user.socket_session.subscriber_id && !conv.users_only;
            });

            if (subIdMatchedConvs.length) {
                await this.roundRobinSend(client, socketRes, sendRes, matchedDepartmentalAgents, subIdMatchedConvs);
            } else {
                // if start then send any one of the agent with same department
                const agentSesId = matchedDepartmentalAgents[0];

                this.roomsInAConv[conv_id].notify_to = agentSesId;

                this.sendToSocketRoom(agentSesId, 'ec_conv_initiated_from_client', {
                    data: { ...sendRes, notify: true, join: true },
                });

                // await this.updateConversationNotifyToValueInDB(client, conv_id, agentSesId);

                this.sendToAllUsersWithout(
                    socketRes,
                    true,
                    [matchedDepartmentalAgents[0]],
                    'ec_conv_initiated_from_client',
                    {
                        data: { ...sendRes, notify: false },
                    },
                );
            }
        }

        // send back to the client
        this.sendToSocketRoom(roomName, 'ec_conv_initiated_to_client', { data: sendRes, status: 'success' });

        // console.log('Rooms In Conversations => ', this.roomsInAConv);

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_join_conversation')
    async joinConversation(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<any> {
        if (!(await this.sysHasConvAndSocketSessionRecheck(data, client))) return;

        const roomName = data.ses_user.socket_session.id;
        const subsId = data.ses_user.socket_session.subscriber_id;

        if (this.roomsInAConv.hasOwnProperty(data.conv_id)) {
            if (this.roomsInAConv[data.conv_id].room_ids.includes(roomName)) {
                return this.sendError(client, 'ec_join_conversation', 'Already joined to this conversation');
            }
        }

        const fromChatTransferRequest = !!(
            data.hasOwnProperty('chat_transfer_request_from') && data.chat_transfer_request_from
        );

        // name is meant to from_chat_transfer_request
        if (fromChatTransferRequest) {
            // clone before remove so that we have all rooms to inform
            const roomsInAConvCopy = _.cloneDeep(this.roomsInAConv);

            _.remove(this.roomsInAConv[data.conv_id].room_ids, (item: any) => this.convClientRoom(data) !== item);

            const joinedAgents = roomsInAConvCopy[data.conv_id].room_ids.filter(
                (roomId: any) => roomId !== roomsInAConvCopy[data.conv_id].client_room_id,
            );

            for (const room of joinedAgents) {
                try {
                    const leftRes: any = await this.httpService
                        .post(
                            `http://localhost:3000/conversations/${data.conv_id}/leave`,
                            { socket_session_id: room, do_log: false },
                            { headers: { Authorization: `Bearer ${client.handshake.query.token}` } },
                        )
                        .toPromise();

                    this.sendToAllUsers(
                        data,
                        false,
                        'ec_is_leaved_from_conversation',
                        {
                            data: { conv_ses_data: leftRes.data },
                            status: 'success',
                        },
                        true,
                        roomsInAConvCopy[data.conv_id],
                    );
                } catch (e) {
                    console.log(e);
                }
            }

            const makeMsg = `transfer_${roomName}`;

            const transferMsg = await this.prisma.message.create({
                data: {
                    message_type: 'log',
                    msg: makeMsg,
                    conversation: { connect: { id: data.conv_id } },
                    subscriber: { connect: { id: data.ses_user.socket_session.subscriber_id } },
                    socket_session: { connect: { id: data.chat_transfer_request_from.socket_session.id } }, // it will be passed as conversation_session
                },
                include: {
                    conversation: {
                        include: {
                            conversation_sessions: {
                                include: {
                                    socket_session: { include: { user: { include: { user_meta: true } } } },
                                },
                            },
                            chat_department: true,
                        },
                    },
                },
            });

            this.sendToSocketRooms(this.usersRoomBySubscriberId(subsId, false), 'ec_msg_from_user', transferMsg);

            this.sendToSocketRoom(
                this.clientRoomFromConv(this.roomsInAConv[data.conv_id]),
                'ec_msg_to_client',
                transferMsg,
            );
        }

        let conv_ses_data = null;

        try {
            const convSesRes: any = await this.httpService
                .post(
                    `http://localhost:3000/conversations/${data.conv_id}`,
                    { from_chat_transfer_request: fromChatTransferRequest },
                    { headers: { Authorization: `Bearer ${client.handshake.query.token}` } },
                )
                .toPromise();

            conv_ses_data = convSesRes.data;

            // if join then turn off ai reply
            if (
                this.roomsInAConv[data.conv_id].hasOwnProperty('ai_is_replying') &&
                this.roomsInAConv[data.conv_id].ai_is_replying
            ) {
                this.roomsInAConv[data.conv_id].ai_is_replying = false;
            }
        } catch (e) {
            return this.sendError(client, 'ec_join_conversation', e.response.data);
        }

        if (this.roomsInAConv.hasOwnProperty(data.conv_id)) {
            if (!this.roomsInAConv[data.conv_id].room_ids.includes(roomName)) {
                this.roomsInAConv[data.conv_id].room_ids.push(roomName);

                // console.log('Rooms In Conversations => ', this.roomsInAConv);
            }

            // for now only checking if join is for first time. currently agents cant initiate client chat so 2 is ok
            // not property chat_inactive_log_handled check means its first time also
            // room_ids does not mean actual joins. its for current status. if all left then room_ids is without client
            // so server restarts chat_inactive_log_handled checks. if not then dont worry
            if (this.roomsInAConv[data.conv_id].room_ids.length === 2) {
                this.roomsInAConv[data.conv_id].last_msg_time_agent = new Date(conv_ses_data.created_at).getTime();

                if (!this.roomsInAConv[data.conv_id].hasOwnProperty('chat_inactive_log_handled')) {
                    this.roomsInAConv[data.conv_id].chat_inactive_log_handled = false;
                }
            }

            // don't move this condition upward. we need after push
            // until that agent joins notification works
            if (
                this.roomsInAConv[data.conv_id].notify_again &&
                this.roomsInAConv[data.conv_id].notify_to === roomName
            ) {
                this.roomsInAConv[data.conv_id].notify_again = false;
                this.roomsInAConv[data.conv_id].notify_to = '';
            }

            // from_chat_transfer_request check in frontend for now. later it will refactored
            // if this key found update this conversations conversation_session type to normal
            // so that for now extra query can be saved
            this.sendToAllUsers(
                data,
                false,
                'ec_is_joined_from_conversation',
                {
                    data: { conv_ses_data, from_chat_transfer_request: fromChatTransferRequest },
                    status: 'success',
                },
                true,
                this.roomsInAConv[data.conv_id],
            );
        } else {
            this.sendError(client, 'ec_join_conversation', 'conversation not matched');
        }

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_leave_conversation')
    async leaveConversation(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<any> {
        if (!(await this.sysHasConvAndSocketSessionRecheck(data, client))) return;

        let conv_ses_data = null;

        try {
            const convSesRes: any = await this.httpService
                .post(
                    `http://localhost:3000/conversations/${data.conv_id}/leave`,
                    {},
                    { headers: { Authorization: `Bearer ${client.handshake.query.token}` } },
                )
                .toPromise();

            conv_ses_data = convSesRes.data;
        } catch (e) {
            return this.sendError(client, 'ec_leave_conversation', e.response.data);
        }

        // console.log('Rooms In Conversations => ', this.roomsInAConv);

        if (this.roomsInAConv.hasOwnProperty(data.conv_id)) {
            // clone before remove so that we have all rooms to inform
            const roomsInAConvCopy = _.cloneDeep(this.roomsInAConv);
            _.remove(this.roomsInAConv[data.conv_id].room_ids, (item: any) => item === data.ses_user.socket_session.id);

            this.sendToAllUsers(
                data,
                false,
                'ec_is_leaved_from_conversation',
                {
                    data: { conv_ses_data },
                    status: 'success',
                },
                true,
                roomsInAConvCopy[data.conv_id],
            );
        } else {
            this.sendError(client, 'ec_leave_conversation', 'Already left from this conversation');
        }

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_close_conversation')
    async closeConversation(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<any> {
        if (!(await this.sysHasConvAndSocketSessionRecheck(data, client))) return;

        const ownRoomId = data.ses_user.socket_session.id;

        let conv_data = null;
        let conv_id = null;

        // partial dataObj
        // closed reason now can send from 30min inactivity
        // if client = {
        //          closed_reason: string,
        // }

        try {
            const convRes: any = await this.httpService
                .post(
                    `http://localhost:3000/conversations/${data.conv_id}/close`,
                    {
                        closed_reason: data.closed_reason || '',
                    },
                    { headers: { Authorization: `Bearer ${client.handshake.query.token}` } },
                )
                .toPromise();

            conv_data = convRes.data;
            conv_id = convRes.data.id;
        } catch (e) {
            return this.sendError(client, 'ec_close_conversation', e.response.data);
        }

        if (this.roomsInAConv.hasOwnProperty(data.conv_id)) {
            const userRooms = Object.keys(this.userClientsInARoom).filter(
                (roomId: any) => this.userClientsInARoom[roomId].sub_id === data.ses_user.socket_session.subscriber_id,
            );

            // before clone remove interval check
            clearInterval(this.roomsInAConv[data.conv_id].timing_actions_interval);

            // clone before remove so that we can inform client. it can be simplified
            const roomsInAConvCopy = _.cloneDeep(this.roomsInAConv);

            delete this.roomsInAConv[data.conv_id];

            // userRooms.forEach((room: any) => {
            //     // filter agents
            //     roomsInAConvCopy = roomsInAConvCopy.filter((copyRoom: any) => copyRoom !== room);
            //
            //     this.server.in(room).emit('ec_is_closed_from_conversation', {
            //         data: {
            //             conv_data,
            //             conv_id,
            //         },
            //         status: 'success',
            //     });
            // });

            this.sendToAllUsers(
                data,
                false,
                'ec_is_closed_from_conversation',
                {
                    data: {
                        conv_data,
                        conv_id,
                    },
                    status: 'success',
                },
                true,
                roomsInAConvCopy[data.conv_id],
            );
        } else {
            this.sendError(client, 'ec_close_conversation', 'This conversation is already closed');
        }

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_is_typing_from_client')
    async typingFromClient(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        let convId = this.convIdFromSession(data);

        if (!convId) {
            const convObj = await this.clientConvFromSession(data, client);

            if (!convObj) return;

            convId = convObj.id;
        }

        // send to all connected users
        this.usersRooms(data).forEach((roomId: any) => {
            this.server.in(roomId).emit('ec_is_typing_from_client', {
                conv_id: convId,
                msg: data.msg,
                temp_id: data.temp_id,
                session_id: data.ses_user.socket_session.id,
                status: data.status,
            }); // send to all users
        });

        // use if needed
        this.server.in(data.ses_user.socket_session.id).emit('ec_is_typing_to_client', {
            conv_id: convId,
            msg: data.msg,
            temp_id: data.temp_id,
            return_type: 'own',
            session_id: data.ses_user.socket_session.id,
            status: data.status,
        }); // return back to client so that we can update to all tab

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_msg_from_client')
    async msgFromClient(@MessageBody() socketRes: any, @ConnectedSocket() client: Socket): Promise<any> {
        let convId = this.convIdFromSession(socketRes);
        const ownRoomId = socketRes.ses_user.socket_session.id;

        if (!convId) {
            const convObj = await this.clientConvFromSession(socketRes, client);

            if (!convObj) return;

            convId = convObj.id;
        }

        let createdMsg: any = null;

        try {
            const msgRes = await this.httpService
                .post(
                    `http://localhost:3000/messages`,
                    {
                        conv_id: convId,
                        msg: socketRes.msg,
                        attachments: socketRes.attachments,
                    },
                    { headers: { Authorization: `Bearer ${client.handshake.query.token}` } },
                )
                .toPromise();

            this.normalClientsInARoom[ownRoomId].chat_status = 'active';
            this.roomsInAConv[convId].last_msg_time_client = new Date(msgRes.data.created_at).getTime();

            // update chat_inactive_log_handled if only this property has. cz inactivity check happens only after join
            // so if joined then update to false so that new log can be inserted
            if (this.roomsInAConv[convId].hasOwnProperty('chat_inactive_log_handled')) {
                this.roomsInAConv[convId].chat_inactive_log_handled = false;
            }

            createdMsg = msgRes.data;
        } catch (e) {
            return this.sendError(client, 'ec_msg_from_client', e.response.data);
        }

        let aiReplyMsg: any = null;

        if (this.convAICanReplying(socketRes)) {
            try {
                const aiReplyRes = await this.httpService
                    .post(
                        `http://localhost:3000/ai/reply`,
                        {
                            conv_id: convId,
                            msg: socketRes.msg,
                        },
                        { headers: { Authorization: `Bearer ${client.handshake.query.token}` } },
                    )
                    .toPromise();

                aiReplyMsg = aiReplyRes.data;

                console.log(aiReplyMsg);

                if (aiReplyMsg) {
                    this.roomsInAConv[convId].ai_is_replying = aiReplyMsg.ai_resolved;
                }
            } catch (e) {
                this.roomsInAConv[convId].ai_is_replying = false;

                console.log(e.response.data, 'ai_error');
                // if needed send to emitted user
            }
        }

        const convObj = this.roomsInAConv[convId];

        this.sendToAllUsers(socketRes, false, 'ec_msg_from_client', {
            ...createdMsg,
            temp_id: socketRes.temp_id,
            ai_is_replying: false,
            init_message_from_client: socketRes.hasOwnProperty('init_message_from_client'),
        });

        if (aiReplyMsg) {
            this.sendToAllUsers(socketRes, false, 'ec_reply_from_ai', {
                ...createdMsg,
                temp_id: socketRes.temp_id,
                ai_is_replying: !!(aiReplyMsg && !!aiReplyMsg.ai_resolved),
            });

            // send to the user
            this.sendToSocketRoom(ownRoomId, 'ec_reply_from_ai', {
                ...aiReplyMsg,
            });
        }

        // use if needed
        this.sendToSocketRoom(ownRoomId, 'ec_msg_to_client', {
            ...createdMsg,
            temp_id: socketRes.temp_id,
            return_type: 'own',
        }); // return to client so that we can update to all tab

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_is_typing_from_user')
    async typingFromUser(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        if (!(await this.sysHasConvAndSocketSessionRecheck(data, client))) return;

        if (this.convIsUserOnly(data)) {
            this.sendToAConvUsersWithoutMe(data, 'ec_is_typing_from_user', {
                conv_id: data.conv_id,
                msg: data.msg,
                temp_id: data.temp_id,
                session_id: data.ses_user.socket_session.id,
                status: data.status,
            });
        } else {
            // it will contain single elm for now
            const clientRooms = [this.convClientRoom(data)];

            if (clientRooms.length) {
                clientRooms.forEach((roomId: any) => {
                    this.server.in(roomId).emit('ec_is_typing_from_user', {
                        conv_id: data.conv_id,
                        msg: data.msg,
                        temp_id: data.temp_id,
                        session_id: data.ses_user.socket_session.id,
                        status: data.status,
                    });
                });
            } else {
                // now user can send msg to client if a client is not present
                // this.sendError(client, 'ec_msg_from_user', 'somehow client is not present in this conversation');
                // return;
            }

            this.sendToAllUsersWithoutMe(data, client, 'ec_is_typing_from_user', {
                conv_id: data.conv_id,
                msg: data.msg,
                temp_id: data.temp_id,
                session_id: data.ses_user.socket_session.id,
                status: data.status,
            });
        }

        // use if needed
        this.server.in(data.ses_user.socket_session.id).emit('ec_is_typing_to_user', {
            conv_id: data.conv_id,
            msg: data.msg,
            temp_id: data.temp_id,
            session_id: data.ses_user.socket_session.id,
            status: data.status,
        }); // return to client so that we can update to all tab

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_msg_from_user')
    async msgFromUser(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        if (!(await this.sysHasConvAndSocketSessionRecheck(data, client))) return;

        let createdMsg: any = null;

        try {
            const msgRes = await this.httpService
                .post(
                    `http://localhost:3000/messages`,
                    {
                        conv_id: data.conv_id,
                        msg: data.msg,
                        attachments: data.attachments,
                    },
                    { headers: { Authorization: `Bearer ${client.handshake.query.token}` } },
                )
                .toPromise();

            this.roomsInAConv[data.conv_id].last_msg_time_agent = new Date(msgRes.data.created_at).getTime();

            // update chat_inactive_log_handled if only this property has. cz inactivity check happens only after join
            // so if joined then update to false so that new log can be inserted
            if (
                !this.roomsInAConv[data.conv_id].users_only &&
                this.roomsInAConv[data.conv_id].hasOwnProperty('chat_inactive_log_handled')
            ) {
                this.roomsInAConv[data.conv_id].chat_inactive_log_handled = false;
            }

            createdMsg = msgRes.data;
        } catch (e) {
            this.server.to(client.id).emit('ec_error', {
                type: 'error',
                step: 'ec_msg_from_user',
                reason: e.response.data,
            });

            return;
        }

        if (this.convIsUserOnly(data)) {
            this.sendToAConvUsersWithoutMe(data, 'ec_msg_from_user', { ...createdMsg, temp_id: data.temp_id });
        } else {
            // it will contain single elm for now
            const clientRooms = [this.convClientRoom(data)];

            if (clientRooms.length) {
                clientRooms.forEach((roomId: any) => {
                    this.server.in(roomId).emit('ec_msg_from_user', {
                        ...createdMsg,
                        temp_id: data.temp_id,
                    });
                });
            } else {
                // now user can send msg to client if a client is not present
                // this.sendError(client, 'ec_msg_from_user', 'somehow client is not present in this conversation');
                // return;
            }

            this.sendToAllUsersWithoutMe(data, client, 'ec_msg_from_user', {
                ...createdMsg,
                temp_id: data.temp_id,
            });
        }

        // use if needed
        this.server.in(data.ses_user.socket_session.id).emit('ec_msg_to_user', {
            ...createdMsg,
            temp_id: data.temp_id,
            return_type: 'own',
        }); // return back to client so that we can update to all tab

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_chat_transfer')
    async chatTransferFromUser(@MessageBody() socketRes: any, @ConnectedSocket() client: Socket): Promise<any> {
        await this.chatTransferService.call(
            this.server,
            client,
            socketRes,
            this.roomsInAConv,
            this.userClientsInARoom,
            this.normalClientsInARoom,
        );
        return;
    }

    // for now, it can only be called by user cz client data has no conv_id
    ownConvObj(data: any) {
        return this.roomsInAConv[data.conv_id];
    }

    convIdFromSession(data: any) {
        return _.findKey(this.roomsInAConv, (convObj: any) =>
            convObj.room_ids.includes(data.ses_user.socket_session.id),
        );
    }

    // it's only for support if system restart happens
    async clientConvFromSession(data: any, client: any) {
        try {
            const convRes: any = await this.httpService
                .get(`http://localhost:3000/socket-sessions/${data.ses_user.socket_session.id}/client-conversation`, {
                    headers: { Authorization: `Bearer ${client.handshake.query.token}` },
                })
                .toPromise();

            if (!convRes.data) {
                this.sendError(client, 'ec_client_conv_check', 'conversation no longer valid');
            } else {
                const conv_data = convRes.data;
                const convId = conv_data.id;

                if (!this.roomsInAConv.hasOwnProperty(convRes.data.id)) {
                    this.roomsInAConv[convRes.data.id] = {
                        conv_id: convRes.data.id,
                        room_ids: _.map(
                            convRes.data.conversation_sessions.filter(
                                (convSes: any) => convSes.joined_at && !convSes.left_at,
                            ),
                            'socket_session_id',
                        ),
                        ai_is_replying: convRes.data.ai_is_replying,
                        routing_policy: convRes.data.routing_policy || 'manual', // check from other_info also
                        sub_id: convRes.data.subscriber_id,
                        notify_to: convRes.data.other_info?.notify_to || null,
                        chat_department: convRes.data.chat_department?.id,
                        created_at: conv_data.created_at,
                        users_only: conv_data.users_only,
                        chat_type: conv_data.chat_type,
                    };

                    this.roomsInAConv[convId].client_room_id = _.find(
                        convRes.data.conversation_sessions,
                        (conv_ses: any) => !conv_ses.socket_session.user,
                    )?.socket_session_id;

                    if (convRes.data.other_info) {
                        this.roomsInAConv[convId].notify_to = convRes.data.other_info?.notify_to || null;
                    }

                    const convObj = this.roomsInAConv[convId];

                    convObj.last_msg_time_client = 0;
                    convObj.last_msg_time_agent = null;

                    const lastClientMsg = await this.prisma.message.findFirst({
                        where: {
                            message_type: { not: 'log' },
                            conversation_id: convId,
                            socket_session: { user_id: null },
                        },
                        orderBy: { created_at: 'desc' },
                    });

                    if (lastClientMsg) {
                        convObj.last_msg_time_client = new Date(lastClientMsg.created_at).getTime();
                    }

                    // for now we are checking agents were joined
                    if (convRes.data.conversation_sessions.length > 1 && !convRes.data.users_only) {
                        const lastAgentMsg = await this.prisma.message.findFirst({
                            where: {
                                message_type: { not: 'log' },
                                conversation_id: convId,
                                socket_session: { user_id: { not: null } },
                            },
                            orderBy: { created_at: 'desc' },
                        });

                        if (lastAgentMsg) {
                            convObj.last_msg_time_agent = new Date(lastAgentMsg.created_at).getTime();
                        } else {
                            convObj.last_msg_time_agent = 0;
                        }

                        const firstJoin = _.sortBy(
                            convRes.data.conversation_sessions.filter((convSes: any) => convSes.socket_session.user_id),
                            [(convSes) => moment(convSes.created_at).format('x')],
                        );

                        if (new Date(firstJoin[0].created_at).getTime() > convObj.last_msg_time_client) {
                            convObj.last_msg_time_client = new Date(firstJoin[0].created_at).getTime();
                        }

                        const chatInactiveLog = await this.prisma.message.findFirst({
                            where: {
                                msg: 'chat_inactive',
                                message_type: 'log',
                                conversation_id: convId,
                            },
                            orderBy: { created_at: 'desc' },
                        });

                        convObj.chat_inactive_log_handled =
                            chatInactiveLog &&
                            (new Date(chatInactiveLog.created_at).getTime() > convObj.last_msg_time_client ||
                                (convObj.last_msg_time_agent !== null &&
                                    new Date(chatInactiveLog.created_at) > convObj.last_msg_time_agent));
                    }

                    convObj.timing_actions_interval = setInterval(() => this.convTimingActionsInterval(convId), 10000);
                }

                // console.log('Rooms In Conversations => ', this.roomsInAConv);

                return convRes.data;
            }
        } catch (e) {
            this.sendError(client, 'ec_client_conv_check', e.response.data);
        }

        return false;
    }

    convAICanReplying(data: any) {
        const convId = this.convIdFromSession(data);
        const convObj = this.roomsInAConv[convId];

        return convObj && (!convObj.hasOwnProperty('ai_is_replying') || convObj.ai_is_replying);
    }

    usersRoomsWithoutMe(data: any, client: any) {
        return Object.keys(this.userClientsInARoom).filter(
            (roomId: any) =>
                this.userClientsInARoom[roomId].sub_id === data.ses_user.socket_session.subscriber_id &&
                !this.userClientsInARoom[roomId].socket_client_ids.includes(
                    client.id, // ignore from same user
                ),
        );
    }

    usersRooms(data: any) {
        return Object.keys(this.userClientsInARoom).filter(
            (roomId: any) => this.userClientsInARoom[roomId].sub_id === data.ses_user.socket_session.subscriber_id,
        );
    }

    convClientRoom(data: any) {
        return this.ownConvObj(data).client_room_id;
    }

    sendToAllUsersWithoutMe(data: any, client: any, emitName: any, dataObj: any) {
        this.usersRoomsWithoutMe(data, client).forEach((roomId: any) => {
            this.server.in(roomId).emit(emitName, dataObj);
        });
    }

    sendToAConvUsersWithoutMe(data: any, emitName: string, dataObj: any) {
        const rooms = this.ownConvObj(data).room_ids.filter(
            (roomId: any) => data.ses_user.socket_session.id !== roomId,
        );

        rooms.forEach((roomId: any) => {
            this.server.in(roomId).emit(emitName, dataObj);
        });
    }

    // it's only for support if system restart happens
    // OR all connected conv relation are cleaned when user|client closed from this conv
    async sysHasConvAndSocketSessionRecheck(data: any, client: any) {
        if (this.convRoomsHasSession(data, client)) return true;

        if (await this.recheckSysHasConv(data, client)) return true;

        this.sendError(client, 'ec_root', 'this conversation not found in the system');

        return false;
    }

    convRoomsHasSession(data: any, client: any, emitError = false) {
        if (
            this.checkConvId(data, client, emitError) &&
            this.sysHasConv(data, client, emitError)
            // this.roomsInAConv[data.conv_id].room_ids.includes(data.ses_user.socket_session.id) // this check is faulty
        )
            return true;

        if (emitError) this.sendError(client, 'ec_root', 'you are not connected with this conversation anymore');

        return false;
    }

    // check if conv_id is passed through data
    checkConvId(data: any, client: any, emitError = false) {
        if (data.hasOwnProperty('conv_id') && data.conv_id) return data.conv_id;

        if (emitError) this.sendError(client, 'ec_root', 'conversation id not present in the request');

        return null;
    }

    sysHasConv(data: any, client: any, emitError = false) {
        if (this.roomsInAConv.hasOwnProperty(data.conv_id)) return data.conv_id;

        if (emitError) this.sendError(client, 'ec_root', 'conversation not found in the system');

        return false;
    }

    // don't call it directly. call sysHasConvAndSocketSessionRecheck
    async recheckSysHasConv(data: any, client: any) {
        const convId = data.conv_id;

        try {
            const convRes: any = await this.httpService
                .get(`http://localhost:3000/conversations/${convId}/sessions`, {
                    headers: { Authorization: `Bearer ${client.handshake.query.token}` },
                })
                .toPromise();

            if (!convRes.data) {
                this.sendError(client, 'ec_recheck_conv', 'conversation not found');
            } else if (convRes.data.closed_at) {
                this.sendError(client, 'ec_recheck_conv', 'conversation is closed');
            } else {
                if (!this.roomsInAConv.hasOwnProperty(convId)) {
                    this.roomsInAConv[convId] = {
                        room_ids: _.map(
                            convRes.data.conversation_sessions.filter(
                                (convSes: any) => convSes.joined_at && !convSes.left_at,
                            ),
                            'socket_session_id',
                        ),
                    };

                    this.roomsInAConv[convId].client_room_id = _.find(
                        convRes.data.conversation_sessions,
                        (conv_ses: any) => !conv_ses.socket_session.user,
                    )?.socket_session_id;

                    this.roomsInAConv[convId].conv_id = convId;

                    this.roomsInAConv[convId].users_only = convRes.data.users_only;
                    this.roomsInAConv[convId].chat_type = convRes.data.type;
                    this.roomsInAConv[convId].created_at = convRes.data.created_at;

                    this.roomsInAConv[convId].ai_is_replying = convRes.data.ai_is_replying;
                    this.roomsInAConv[convId].routing_policy = convRes.data.routing_policy || 'manual';
                    this.roomsInAConv[convId].sub_id = convRes.data.subscriber_id;
                    this.roomsInAConv[convId].chat_department = convRes.data.chat_department?.id;

                    if (convRes.data.other_info) {
                        this.roomsInAConv[convId].notify_to = convRes.data.other_info?.notify_to || null;
                    }

                    const convObj = this.roomsInAConv[convId];

                    convObj.last_msg_time_client = 0;
                    convObj.last_msg_time_agent = null; // important for interval

                    const lastClientMsg = await this.prisma.message.findFirst({
                        where: {
                            message_type: { not: 'log' },
                            conversation_id: convId,
                            socket_session: { user_id: null },
                        },
                        orderBy: { created_at: 'desc' },
                    });

                    if (lastClientMsg) {
                        convObj.last_msg_time_client = new Date(lastClientMsg.created_at).getTime();
                    }

                    // for now we are checking agents were joined
                    if (convRes.data.conversation_sessions.length > 1 && !convRes.data.users_only) {
                        const lastAgentMsg = await this.prisma.message.findFirst({
                            where: {
                                message_type: { not: 'log' },
                                conversation_id: convId,
                                socket_session: { user_id: { not: null } },
                            },
                            orderBy: { created_at: 'desc' },
                        });

                        if (lastAgentMsg) {
                            convObj.last_msg_time_agent = new Date(lastAgentMsg.created_at).getTime();
                        } else {
                            convObj.last_msg_time_agent = 0;
                        }

                        const firstJoin = _.sortBy(
                            convRes.data.conversation_sessions.filter((convSes: any) => convSes.socket_session.user_id),
                            [(convSes) => moment(convSes.created_at).format('x')],
                        );

                        if (new Date(firstJoin[0].created_at).getTime() > convObj.last_msg_time_client) {
                            convObj.last_msg_time_client = new Date(firstJoin[0].created_at).getTime();
                        }

                        const chatInactiveLog = await this.prisma.message.findFirst({
                            where: {
                                msg: 'chat_inactive',
                                message_type: 'log',
                                conversation_id: convId,
                            },
                            orderBy: { created_at: 'desc' },
                        });

                        const lastMsgTime =
                            convObj.last_msg_time_agent !== null &&
                            convObj.last_msg_time_agent > convObj.last_msg_time_client
                                ? convObj.last_msg_time_agent
                                : convObj.last_msg_time_client;

                        convObj.chat_inactive_log_handled =
                            chatInactiveLog && new Date(chatInactiveLog.created_at).getTime() > lastMsgTime;
                    }

                    convObj.timing_actions_interval = setInterval(() => this.convTimingActionsInterval(convId), 10000);
                }

                // console.log('Rooms In Conversations => ', this.roomsInAConv);

                return true;
            }
        } catch (e) {
            this.sendError(client, 'ec_recheck_conv', e.response.data);
        }

        return false;
    }

    // don't call it directly
    convIsUserOnly(data: any) {
        return !!this.roomsInAConv[data.conv_id].users_only;
    }

    async afterInit(server: Server) {
        console.log('Socket Gateway Initialized');

        // if for anyhow server restart happens load unhandled convs
        const allConvs = await this.prisma.conversation.findMany({
            where: {
                users_only: false,
                closed_at: null,
            },
            include: {
                conversation_sessions: {
                    include: { socket_session: { include: { user: { include: { user_meta: true } } } } },
                },
                chat_department: true,
                messages: {
                    where: {
                        message_type: 'log',
                        msg: 'chat_inactive',
                    },
                    orderBy: { created_at: 'desc' },
                    take: 1,
                },
            },
            orderBy: { created_at: 'desc' },
        });

        for (const tempConv of allConvs) {
            const conv: any = tempConv;
            const convId = conv.id;

            if (!this.roomsInAConv.hasOwnProperty(convId)) {
                this.roomsInAConv[convId] = {
                    room_ids: _.map(
                        conv.conversation_sessions.filter((convSes: any) => !convSes.left_at && convSes.joined_at),
                        'socket_session_id',
                    ),
                };

                this.roomsInAConv[convId].client_room_id = _.find(
                    conv.conversation_sessions,
                    (conv_ses: any) => !conv_ses.socket_session.user,
                )?.socket_session_id;

                this.roomsInAConv[convId].conv_id = conv.id;

                this.roomsInAConv[convId].users_only = conv.users_only;
                this.roomsInAConv[convId].chat_type = conv.type;
                this.roomsInAConv[convId].created_at = conv.created_at;

                this.roomsInAConv[convId].ai_is_replying = conv.ai_is_replying;
                this.roomsInAConv[convId].routing_policy = conv.routing_policy || 'manual'; // or check conv.other_info.routing_policy
                this.roomsInAConv[convId].sub_id = conv.subscriber_id;
                this.roomsInAConv[convId].chat_department = conv.chat_department?.id;

                if (conv.other_info) {
                    this.roomsInAConv[convId].notify_to = conv.other_info?.notify_to || null;
                }

                const convObj = this.roomsInAConv[convId];

                // from this line upto last same type of conditions has more then 2 places
                convObj.last_msg_time_client = 0;
                convObj.last_msg_time_agent = null;

                const lastClientMsg = await this.prisma.message.findFirst({
                    where: {
                        message_type: { not: 'log' },
                        conversation_id: convId,
                        socket_session: { user_id: null },
                    },
                    orderBy: { created_at: 'desc' },
                });

                if (lastClientMsg) {
                    convObj.last_msg_time_client = new Date(lastClientMsg.created_at).getTime();
                }

                // for now we are checking agents were joined
                // if joined start inactivity check
                if (conv.conversation_sessions.length > 1) {
                    const lastAgentMsg = await this.prisma.message.findFirst({
                        where: {
                            message_type: { not: 'log' },
                            conversation_id: convId,
                            socket_session: { user_id: { not: null } },
                        },
                        orderBy: { created_at: 'desc' },
                    });

                    if (lastAgentMsg) {
                        convObj.last_msg_time_agent = new Date(lastAgentMsg.created_at).getTime();
                    } else {
                        convObj.last_msg_time_agent = 0;
                    }

                    // get first join for check clients msg before or after
                    const firstJoin = _.sortBy(
                        conv.conversation_sessions.filter((convSes: any) => convSes.socket_session.user_id),
                        [(convSes) => moment(convSes.created_at).format('x')],
                    );

                    // store join time if client msg was before join. so that inactivity count starts from join
                    if (new Date(firstJoin[0].created_at).getTime() > convObj.last_msg_time_client) {
                        convObj.last_msg_time_client = new Date(firstJoin[0].created_at).getTime();
                    }

                    // assign key only when if any joins happen.
                    // true if has log & log is newer then client msg || agent msg
                    const lastMsgTime =
                        convObj.last_msg_time_agent !== null &&
                        convObj.last_msg_time_agent > convObj.last_msg_time_client
                            ? convObj.last_msg_time_agent
                            : convObj.last_msg_time_client;

                    convObj.chat_inactive_log_handled =
                        !!conv.messages.length && // conv.messages can only contain chat inactive log msg
                        new Date(conv.messages[0].created_at).getTime() > lastMsgTime;
                }

                convObj.timing_actions_interval = setInterval(() => this.convTimingActionsInterval(convId), 10000);
            }
        }

        // console.log(this.roomsInAConv);
    }

    async convTimingActionsInterval(convId: any) {
        const convObj = this.roomsInAConv[convId];
        const intervalTime = 10 * 60 * 1000;
        const convCloseIntervalTime = 60 * 60 * 1000;

        const lastMsgTime =
            convObj.last_msg_time_agent !== null && convObj.last_msg_time_agent > convObj.last_msg_time_client
                ? convObj.last_msg_time_agent
                : convObj.last_msg_time_client;

        // property chat_inactive_log_handled will only insert if join. & if not log handled store it
        if (
            convObj.hasOwnProperty('chat_inactive_log_handled') &&
            !convObj.chat_inactive_log_handled &&
            !convObj.users_only
        ) {
            if (new Date().getTime() > lastMsgTime + intervalTime) {
                const createdLog = await this.prisma.message.create({
                    data: {
                        msg: 'chat_inactive',
                        message_type: 'log',
                        conversation: { connect: { id: convId } },
                        subscriber: { connect: { id: convObj.sub_id } },
                    },
                    include: {
                        conversation: {
                            include: {
                                conversation_sessions: {
                                    include: {
                                        socket_session: { include: { user: { include: { user_meta: true } } } },
                                    },
                                },
                                chat_department: true,
                            },
                        },
                    },
                });

                this.sendToSocketRooms(
                    this.usersRoomBySubscriberId(convObj.sub_id, false),
                    'ec_msg_from_client',
                    createdLog,
                );

                this.sendToSocketRoom(this.clientRoomFromConv(convObj), 'ec_msg_to_client', createdLog);

                convObj.chat_inactive_log_handled = true;

                // console.log('chat inactive stored');
            }
        }

        // close conversation interval action. do this last. in join chat_inactive_log_handled check is making it safe
        if (
            !convObj.users_only &&
            new Date().getTime() > lastMsgTime + convCloseIntervalTime &&
            convObj.last_msg_time_agent !== null // that means agents were joined
        ) {
            console.log('conv close candidate', convId);

            const updateCount = await this.prisma.conversation.updateMany({
                where: {
                    id: convId,
                    users_only: false,
                    closed_at: null,
                    subscriber_id: convObj.sub_id,
                },
                data: {
                    closed_at: new Date(),
                    closed_reason: 'Chat is closed due to inactivity',
                },
            });

            if (updateCount.count === 1) {
                const conv_data: any = await this.prisma.conversation.findUnique({
                    where: { id: convId },
                    include: {
                        closed_by: {
                            include: {
                                user: { include: { user_meta: true } },
                            },
                        },
                        conversation_sessions: {
                            include: {
                                socket_session: {
                                    include: {
                                        user: { include: { user_meta: true } },
                                    },
                                },
                            },
                        },
                    },
                });

                conv_data.log_message = await this.prisma.message.create({
                    data: {
                        msg: 'closed',
                        message_type: 'log',
                        conversation: { connect: { id: convId } },
                        subscriber: { connect: { id: convObj.sub_id } },
                    },
                });

                // before clone remove interval check
                clearInterval(this.roomsInAConv[convId].timing_actions_interval);

                // clone before remove so that we can inform client. it can be simplified
                const roomsInAConvCopy = _.cloneDeep(this.roomsInAConv);

                delete this.roomsInAConv[convId];

                this.listenersHelperService.sendToSocketRooms(
                    this.server,
                    this.listenersHelperService.usersRoomBySubscriberId(
                        this.userClientsInARoom,
                        roomsInAConvCopy[convId].sub_id,
                    ),
                    'ec_is_closed_from_conversation',
                    {
                        data: { conv_data, conv_id: convId },
                        status: 'success',
                    },
                );

                this.sendToSocketRoom(convObj.client_room_id, 'ec_is_closed_from_conversation', {
                    data: { conv_data, conv_id: convId },
                    status: 'success',
                });
            }
        }
    }

    clientRoomFromConv(conv: any) {
        return conv.client_room_id;
    }

    async handleConnection(client: Socket, ...args: any[]) {
        console.log(`Socket Client connected: ${client.id}`);

        // if client
        // check the token from client.handshake.query.[token && sessId] and get assigned room which is conversation_id
        // let roomName = room_name
        // this.client.join(roomName)

        let decodedToken = null;
        let socket_session = null;
        let chat_departments = null;

        const queryParams = client?.handshake?.query;

        if (queryParams && queryParams.token) {
            decodedToken = this.authService.verifyToken(queryParams.token);

            if (decodedToken) {
                socket_session = decodedToken.data.socket_session;
                chat_departments = decodedToken.data.chat_departments;
            } else {
                return this.sendError(client, 'at_connect', 'token invalid');
            }
        } else {
            return this.sendError(client, 'at_connect', 'token invalid');
        }

        const roomName = socket_session.id;

        // check client type from api
        const dynamicInARoom = queryParams.client_type === 'user' ? 'userClientsInARoom' : 'normalClientsInARoom';

        if (!this[dynamicInARoom].hasOwnProperty(roomName)) {
            this[dynamicInARoom][roomName] = {
                socket_client_ids: [],
                sub_id: socket_session.subscriber_id,
            };

            if (queryParams.client_type === 'user') {
                if (chat_departments && chat_departments.length) {
                    this.userClientsInARoom[roomName].chat_departments = _.map(chat_departments, 'id');
                    this.userClientsInARoom[roomName].online_status =
                        queryParams.online_status || decodedToken.online_status;
                }

                const userRooms = Object.keys(this.userClientsInARoom).filter(
                    (roomId: any) => this.userClientsInARoom[roomId].sub_id === socket_session.subscriber_id,
                );

                userRooms.forEach((roomId: any) => {
                    this.server.in(roomId).emit('ec_user_logged_in', {
                        ses_id: socket_session.id,
                    }); // send to all other users

                    this.server.in(roomId).emit('ec_updated_socket_room_info_res', {
                        action: 'online_status',
                        type: 'user',
                        ses_id: roomName,
                        data: { online_status: queryParams.online_status || decodedToken.online_status },
                    });
                });
            }
        }

        if (!this[dynamicInARoom][roomName].socket_client_ids.includes(client.id)) {
            this[dynamicInARoom][roomName].socket_client_ids.push(client.id);
        }

        client.join(roomName);

        // console.log('User Clients => ', this.userClientsInARoom);
        // console.log('Normal Clients => ', this.normalClientsInARoom);
        // console.log('Rooms In Conversations => ', this.roomsInAConv);
    }

    handleDisconnect(client: Socket) {
        console.log(`Socket Client disconnected: ${client.id}`);
        // console.log(client?.handshake?.query);

        let socket_session = null;

        const queryParams = client?.handshake?.query;

        if (queryParams && queryParams.token) {
            const decodedToken = this.authService.verifyToken(queryParams.token);

            if (decodedToken) {
                socket_session = decodedToken.data.socket_session;
                // console.log(socket_session);
            } else {
                return this.sendError(client, 'at_connect', 'token invalid');
            }
        } else {
            return this.sendError(client, 'at_connect', 'token invalid');
        }

        const roomName = socket_session.id;

        let idIsDeleted = false;

        if (this.normalClientsInARoom.hasOwnProperty(roomName)) {
            _.remove(this.normalClientsInARoom[roomName].socket_client_ids, (item: any) => {
                if (item === client.id) {
                    idIsDeleted = true;
                }

                return idIsDeleted;
            });

            if (!this.normalClientsInARoom[roomName].socket_client_ids.length) {
                delete this.normalClientsInARoom[roomName];

                client.leave(roomName);
            }
        }

        if (this.userClientsInARoom.hasOwnProperty(roomName) && !idIsDeleted) {
            _.remove(this.userClientsInARoom[roomName].socket_client_ids, (item: any) => item === client.id);

            if (!this.userClientsInARoom[roomName].socket_client_ids.length) {
                delete this.userClientsInARoom[roomName];

                client.leave(roomName);

                if (queryParams.client_type === 'user') {
                    const userRooms = Object.keys(this.userClientsInARoom).filter(
                        (roomId: any) => this.userClientsInARoom[roomId].sub_id === socket_session.subscriber_id,
                    );

                    userRooms.forEach((roomId: any) => {
                        // remove this block after handle next block
                        this.server.in(roomId).emit('ec_user_logged_out', {
                            user_ses_id: socket_session.id,
                        }); // send to all other users

                        this.server.in(roomId).emit('ec_updated_socket_room_info_res', {
                            action: 'online_status',
                            type: 'user',
                            ses_id: roomName,
                            data: { online_status: 'offline' }, // before checking this first check if user has online status
                        });
                    });
                }
            }
        }

        // console.log('User Clients => ', this.userClientsInARoom);
        // console.log('Normal Clients => ', this.normalClientsInARoom);
        // console.log('Rooms In Conversations => ', this.roomsInAConv);
    }

    sendError(client: any, step: string, msg: string | any = 'you are doing something wrong', extra = {}) {
        client.emit('ec_error', {
            type: 'warning',
            step: step,
            reason: msg,
            ...extra,
        });
    }

    async sleep(ms = 3000) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
