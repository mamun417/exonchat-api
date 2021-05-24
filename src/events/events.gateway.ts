import { HttpService, UseGuards } from '@nestjs/common';
import {
    MessageBody,
    ConnectedSocket,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

import * as _ from 'lodash';
import { WsJwtGuard } from 'src/auth/guards/ws-auth.guard';
import { AuthService } from 'src/auth/auth.service';

@WebSocketGateway({ serveClient: false })
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    constructor(private httpService: HttpService, private authService: AuthService) {}

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
    // but only data.ses_user.subscriber_id. its only for user end. if you dont get the data that means
    // your ses is not for user

    private userClientsInARoom: any = {}; // users/agents {ses_id: {socket_client_ids: [], sub_id: subscriber_id}}
    private normalClientsInARoom: any = {}; // normal clients from site web-chat {ses_id: {socket_client_ids: [], sub_id: subscriber_id}}
    private roomsInAConv: any = {}; // {conv_id: {room_ids: [], sub_id: subscriber_id, users_only: bool, ai_is_replying: bool}}

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_get_logged_users') // get users list when needed
    async usersOnline(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        // get all logged users with the subscriber_id
        const users = Object.keys(this.userClientsInARoom).filter(
            (roomId: any) => this.userClientsInARoom[roomId].sub_id === data.ses_user.subscriber_id,
        );

        this.server.to(client.id).emit('ec_logged_users_res', {
            users: users,
        });

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_get_clients_ses_id_status')
    async getClientsSesIdStatus(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        const roomName = data.ses_user.socket_session.id;

        let status = 'left';

        if (data.hasOwnProperty('client_ses_id') && data.client_ses_id) {
            if (
                this.normalClientsInARoom.hasOwnProperty(data.client_ses_id) &&
                this.normalClientsInARoom[data.client_ses_id].socket_client_ids.length &&
                this.normalClientsInARoom[data.client_ses_id].sub_id === data.ses_user.subscriber_id
            ) {
                status = 'online';
            }

            this.server.in(roomName).emit('ec_get_clients_ses_id_status_res', {
                ses_id: data.client_ses_id,
                status: status,
            });
        }

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_page_visit_info_from_client')
    async pageVisitInfoFromClient(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        const userRooms = Object.keys(this.userClientsInARoom).filter(
            (roomId: any) => this.userClientsInARoom[roomId].sub_id === data.ses_user.subscriber_id,
        );

        // console.log(userRooms);

        userRooms.forEach((roomId: any) => {
            this.server.in(this.userClientsInARoom[roomId]).emit('ec_page_visit_info_from_client', {
                url: data.url,
                sent_at: data.sent_at,
            }); // send to all users
        });

        return;
    }

    // load each users coversation so that they can send msg
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_reload_user_to_user_chat')
    async init_user_to_user_chat(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<any> {
        let conv_data = [];

        try {
            const convRes: any = await this.httpService
                .get('http://localhost:3000/conversations/user-to-user/me', {
                    headers: { Authorization: `Bearer ${client.handshake.query.token}` },
                })
                .toPromise();

            conv_data = convRes.data;
        } catch (e) {
            // console.log(e.response.data);

            this.sendError(client, 'ec_reload_user_to_user_chat', e.response.data);

            return;
        }

        const roomName = data.ses_user.socket_session.id;

        if (conv_data.length) {
            conv_data.forEach((conv: any) => {
                if (!this.roomsInAConv.hasOwnProperty(conv.id)) {
                    this.roomsInAConv[conv.id] = { room_ids: _.map(conv.conversation_sessions, 'socket_session_id') };

                    this.roomsInAConv[conv.id].users_only = true;
                }
            });
        }
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_init_conv_from_user')
    async init_conversation_from_user(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
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
            // console.log(e.response.data);

            this.sendError(client, 'ec_init_conv_from_user', e.response.data);

            return;
        }

        const roomName = data.ses_user.socket_session.id;

        if (!this.roomsInAConv.hasOwnProperty(conv_id)) {
            this.roomsInAConv[conv_id] = { room_ids: [roomName, ...data.ses_ids] };

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

        // if api error
        // this.server.to(client.id).emit('ec_error', {
        //     type: 'warning',
        //     step: 'ec_conv_initiated_from_user',
        //     reason: 'err.msg',
        // });

        console.log('Rooms In Convs => ', this.roomsInAConv);

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_init_conv_from_client')
    async init_conversation_from_client(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        let conv_data = null;
        let conv_id = null;

        try {
            const convRes: any = await this.httpService
                .post(
                    'http://localhost:3000/conversations',
                    {
                        chat_type: 'live_chat',
                        name: data.name,
                        email: data.email,
                        department: data.department,
                    },
                    { headers: { Authorization: `Bearer ${client.handshake.query.token}` } },
                )
                .toPromise();

            conv_data = convRes.data;
            conv_id = convRes.data.id;
        } catch (e) {
            // console.log(e.response.data);

            this.sendError(client, 'ec_init_conv_from_client', e.response.data);

            return;
        }

        const roomName = data.ses_user.socket_session.id;

        if (!this.roomsInAConv.hasOwnProperty(conv_id)) {
            this.roomsInAConv[conv_id] = { room_ids: [roomName] };
        } else {
            this.server.to(client.id).emit('ec_error', {
                type: 'error',
                step: 'ec_init_conv_from_client',
                reason: 'conv id already exists',
            });

            return;
        }

        this.server.in(roomName).emit('ec_conv_initiated_to_client', {
            data: {
                conv_data,
                conv_id,
            },
            status: 'success',
        });

        // if api error
        // this.server.to(client.id).emit('ec_error', {
        //     type: 'warning',
        //     step: 'ec_init_conv_from_client',
        //     reason: 'err.msg',
        // });

        console.log('Rooms In Convs => ', this.roomsInAConv);

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_join_conversation')
    async joinConversation(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        if (!(await this.sysHasConvAndSocketSessionRecheck(data, client))) return;

        let conv_ses_data = null;

        try {
            const convSesRes: any = await this.httpService
                .post(
                    `http://localhost:3000/conversations/${data.conv_id}`,
                    {},
                    { headers: { Authorization: `Bearer ${client.handshake.query.token}` } },
                )
                .toPromise();

            conv_ses_data = convSesRes.data;

            // console.log(convSesRes);

            // if join then turn off ai reply
            if (
                this.roomsInAConv[data.conv_id].hasOwnProperty('ai_is_replying') &&
                this.roomsInAConv[data.conv_id].ai_is_replying
            ) {
                this.roomsInAConv[data.conv_id].ai_is_replying = false;
            }
        } catch (e) {
            // console.log(e.response.data);

            this.server.to(client.id).emit('ec_error', {
                type: 'error',
                step: 'ec_join_conversation',
                reason: e.response.data,
            });

            return;
        }

        // call check api for conv_id, sub_id & ses_id
        const user_info = {}; //get user info

        const roomName = data.ses_user.socket_session.id;

        // call join conversation api and get msg. there will handle join limit also
        // if done
        if (this.roomsInAConv.hasOwnProperty(data.conv_id)) {
            if (!this.roomsInAConv[data.conv_id].room_ids.includes(data.ses_user.socket_session.id)) {
                this.roomsInAConv[data.conv_id].room_ids.push(data.ses_user.socket_session.id);
            }

            this.roomsInAConv[data.conv_id].room_ids.forEach((room: any) => {
                this.server.in(room).emit('ec_is_joined_from_conversation', {
                    data: {
                        conv_ses_data,
                    },
                    status: 'success',
                });
            });
        } else {
            this.server.to(client.id).emit('ec_error', {
                type: 'error',
                step: 'ec_join_conversation',
                reason: 'conversation not matched',
            });

            return;
        }

        console.log('Rooms In Convs => ', this.roomsInAConv);

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_leave_conversation')
    async leaveConversation(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
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
            // console.log(e.response.data);

            this.server.to(client.id).emit('ec_error', {
                type: 'error',
                step: 'ec_leave_conversation',
                reason: e.response.data,
            });

            return;
        }

        // call check api for conv_id, sub_id & ses_id

        const roomName = data.ses_user.socket_session.id;

        console.log('Rooms In Convs => ', this.roomsInAConv);

        if (this.roomsInAConv.hasOwnProperty(data.conv_id)) {
            // clone before remove so that we have all rooms to inform
            const roomsInAConvCopy = _.cloneDeep(this.roomsInAConv);
            _.remove(this.roomsInAConv[data.conv_id].room_ids, (item: any) => item === data.ses_user.socket_session.id);

            roomsInAConvCopy[data.conv_id].room_ids.forEach((room: any) => {
                this.server.in(room).emit('ec_is_leaved_from_conversation', {
                    data: { conv_ses_data },
                    status: 'success',
                });
            });
        } else {
            this.server.to(client.id).emit('ec_error', {
                type: 'error',
                step: 'ec_leave_conversation',
                reason: 'Already Leaved from Current Conversation',
            });

            return;
        }

        // if api error
        // this.server.to(client.id).emit('ec_error', {
        //     type: 'warning',
        //     step: 'at_leave_conversation',
        //     reason: 'err.msg',
        // });

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_close_conversation')
    async closeConversation(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        if (!(await this.sysHasConvAndSocketSessionRecheck(data, client))) return;

        let conv_data = null;
        let conv_id = null;

        try {
            const convRes: any = await this.httpService
                .post(
                    `http://localhost:3000/conversations/${data.conv_id}/close`,
                    {},
                    { headers: { Authorization: `Bearer ${client.handshake.query.token}` } },
                )
                .toPromise();

            conv_data = convRes.data;
            conv_id = convRes.data.id;
        } catch (e) {
            // console.log(e.response.data);

            this.server.to(client.id).emit('ec_error', {
                type: 'error',
                step: 'ec_close_conversation',
                reason: e.response.data,
            });

            return;
        }

        // call check api for conv_id, sub_id & ses_id

        const roomName = data.ses_user.socket_session.id;

        if (this.roomsInAConv.hasOwnProperty(data.conv_id)) {
            // clone before remove so that we have all rooms to inform

            const userRooms = Object.keys(this.userClientsInARoom).filter(
                (roomId: any) => this.userClientsInARoom[roomId].sub_id === data.ses_user.socket_session.subscriber_id,
            );

            let roomsInAConvCopy = this.roomsInAConv[data.conv_id].room_ids;

            delete this.roomsInAConv[data.conv_id];

            userRooms.forEach((room: any) => {
                roomsInAConvCopy = roomsInAConvCopy.filter((copyRoom: any) => copyRoom !== room);

                this.server.in(room).emit('ec_is_closed_from_conversation', {
                    data: {
                        conv_data,
                        conv_id,
                    },
                    status: 'success',
                });
            });

            // if closed from client then it can be empty so check for error free
            if (roomsInAConvCopy.length) {
                // for now only one room id will present & it is clients
                roomsInAConvCopy.forEach((room: string) => {
                    this.server.in(room).emit('ec_is_closed_from_conversation', {
                        data: {
                            conv_data,
                            conv_id,
                        },
                        status: 'success',
                    });
                });
            }
        } else {
            this.server.to(client.id).emit('ec_error', {
                type: 'error',
                step: 'ec_close_conversation',
                reason: 'Already Closed from Current Conversation',
            });

            return;
        }

        // if api error
        // this.server.to(client.id).emit('ec_error', {
        //     type: 'warning',
        //     step: 'at_leave_conversation',
        //     reason: 'err.msg',
        // });

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_is_typing_from_client')
    async typingFromClient(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        const convId = _.findKey(this.roomsInAConv, (convObj: any) => {
            return convObj.room_ids.includes(data.ses_user.socket_session.id);
        }); // get conv_id from ses id

        // get all users with the sub_id
        const userRooms = Object.keys(this.userClientsInARoom).filter(
            (roomId: any) => this.userClientsInARoom[roomId].sub_id === data.ses_user.socket_session.subscriber_id,
        );

        // send to all connected users
        userRooms.forEach((roomId: any) => {
            this.server.in(roomId).emit('ec_is_typing_from_client', {
                conversation_id: convId,
                msg: data.msg,
                temp_id: data.temp_id,
            }); // send to all users
        });

        // use if needed
        this.server.in(data.ses_user.socket_session.id).emit('ec_is_typing_to_client', {
            conversation_id: convId,
            msg: data.msg,
            temp_id: data.temp_id,
            return_type: 'own',
        }); // return back to client so that we can update to all tab

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_msg_from_client')
    async msgFromClient(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        let convId = this.convIdFromSession(data);

        if (!convId) {
            const convObj = await this.clientConvFromSession(data, client);

            if (!convObj) return;

            convId = convObj.id;

            if (!this.roomsInAConv.hasOwnProperty(convId)) {
                this.roomsInAConv[convId] = {
                    room_ids: _.map(convObj.conversation_sessions, 'socket_session_id'),
                };
            }
        }

        let createdMsg: any = null;

        try {
            const msgRes = await this.httpService
                .post(
                    `http://localhost:3000/messages`,
                    {
                        conv_id: convId,
                        msg: data.msg,
                        attachments: data.attachments,
                    },
                    { headers: { Authorization: `Bearer ${client.handshake.query.token}` } },
                )
                .toPromise();

            createdMsg = msgRes.data;
        } catch (e) {
            this.server.to(client.id).emit('ec_error', {
                type: 'error',
                step: 'ec_msg_from_client',
                reason: e.response.data,
            });

            return;
        }

        let aiReplyMsg: any = null;

        if (this.convAICanReplying(data)) {
            try {
                const aiReplyRes = await this.httpService
                    .post(
                        `http://localhost:3000/ai/reply`,
                        {
                            conv_id: convId,
                            msg: data.msg,
                        },
                        { headers: { Authorization: `Bearer ${client.handshake.query.token}` } },
                    )
                    .toPromise();

                aiReplyMsg = aiReplyRes.data;

                if (aiReplyMsg) {
                    this.roomsInAConv[convId].ai_is_replying = !!aiReplyMsg.ai_resolved;
                }
            } catch (e) {
                console.log(e.response.data, 'ai_error');
                // if need send to emited user
            }
        }

        // send to all connected users
        this.sendToAllUsers(data, 'ec_msg_from_client', {
            ...createdMsg,
            temp_id: data.temp_id,
            ai_is_replying: aiReplyMsg && !!aiReplyMsg.ai_resolved,
        });

        if (aiReplyMsg) {
            this.sendToAllUsers(data, 'ec_reply_from_ai', {
                ...createdMsg,
                temp_id: data.temp_id,
                ai_is_replying: aiReplyMsg && !!aiReplyMsg.ai_resolved,
            });
        }

        // use if needed
        this.server.in(data.ses_user.socket_session.id).emit('ec_msg_to_client', {
            ...createdMsg,
            temp_id: data.temp_id,
            return_type: 'own',
        }); // return back to client so that we can update to all tab

        if (aiReplyMsg) {
            this.server.in(data.ses_user.socket_session.id).emit('ec_reply_from_ai', {
                ...aiReplyMsg,
            });
        }

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_is_typing_from_user')
    async typingFromUser(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        if (
            this.roomsInAConv.hasOwnProperty(data.conv_id) &&
            this.roomsInAConv[data.conv_id].room_ids.includes(data.ses_user.socket_session.id)
        ) {
            const convObj = this.roomsInAConv[data.conv_id];

            if (convObj.hasOwnProperty('users_only') && convObj.users_only) {
                //
            } else {
                const userRooms = Object.keys(this.userClientsInARoom).filter(
                    (roomId: any) =>
                        this.userClientsInARoom[roomId].sub_id === data.ses_user.subscriber_id &&
                        !this.userClientsInARoom[roomId].socket_client_ids.includes(
                            client.id, // ignore from same user
                        ),
                );

                // it will contain single elm for now
                const clientRooms = convObj.room_ids.filter(
                    (roomId: any) => this.normalClientsInARoom[roomId]?.sub_id === data.ses_user.subscriber_id,
                );

                if (clientRooms.length === 1) {
                    clientRooms.forEach((roomId: any) => {
                        this.server.in(roomId).emit('ec_is_typing_from_user', {
                            conversation_id: data.conv_id,
                            msg: data.msg,
                            temp_id: data.temp_id,
                        });
                    });
                } else {
                    this.server.to(client.id).emit('ec_error', {
                        type: 'warning',
                        step: 'ec_is_typing_from_user',
                        reason: 'Somehow client is not present in this conv',
                    });

                    return;
                }

                userRooms.forEach((roomId: any) => {
                    this.server.in(roomId).emit('ec_is_typing_from_user', {
                        conversation_id: data.conv_id,
                        msg: data.msg,
                        temp_id: data.temp_id,
                    }); // send to all other users
                });
            }
        } else {
            this.server.to(client.id).emit('ec_error', {
                type: 'warning',
                step: 'ec_is_typing_from_user',
                reason: 'You are doing something wrong',
            });

            return;
        }

        // use if needed
        this.server.in(data.ses_user.socket_session.id).emit('ec_is_typing_to_user', {
            conversation_id: data.conv_id,
            msg: data.msg,
            temp_id: data.temp_id,
            return_type: 'own',
        }); // return back to client so that we can update to all tab

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
            const clientRooms = this.convClientRoom(data);

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

    ownConvObj(data: any) {
        return this.roomsInAConv[data.conv_id];
    }

    convIdFromSession(data: any) {
        return _.findKey(this.roomsInAConv, (convObj: any) =>
            convObj.room_ids.includes(data.ses_user.socket_session.id),
        );
    }

    // its only for support if system restart happens
    // OR all connected conv relation are cleaned when user|client closed from this conv
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
                if (!this.roomsInAConv.hasOwnProperty(convRes.data.id)) {
                    this.roomsInAConv[convRes.data.id] = {
                        room_ids: _.map(convRes.data.conversation_sessions, 'socket_session_id'),
                    };
                }

                return convRes.data;
            }
        } catch (e) {
            this.sendError(client, 'ec_client_conv_check', e.response.data);
        }

        return false;
    }

    convAICanReplying(data: any) {
        const convObj = this.ownConvObj(data);
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
        return this.ownConvObj(data).room_ids.filter(
            (roomId: any) => this.normalClientsInARoom[roomId]?.sub_id === data.ses_user.socket_session.subscriber_id,
        );
    }

    sendToAllUsersWithoutMe(data: any, client: any, emitName: any, dataObj: any) {
        this.usersRoomsWithoutMe(data, client).forEach((roomId: any) => {
            this.server.in(roomId).emit(emitName, dataObj);
        });
    }

    sendToAllUsers(data: any, emitName: any, dataObj: any) {
        this.usersRooms(data).forEach((roomId: any) => {
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

    // its only for support if system restart happens
    // OR all connected conv relation are cleaned when user|client closed from this conv
    async sysHasConvAndSocketSessionRecheck(data: any, client: any) {
        if (this.convRoomsHasSession(data, client)) return true;

        if (
            (await this.recheckSysHasConv(data, client)) &&
            this.roomsInAConv[data.conv_id].room_ids.includes(data.ses_user.socket_session.id)
        )
            return true;

        this.sendError(client, 'ec_root', 'this conversation not found in the system');

        return false;
    }

    convRoomsHasSession(data: any, client: any, emitError = false) {
        if (
            this.checkConvId(data, client) &&
            this.sysHasConv(data, client) &&
            this.roomsInAConv[data.conv_id].room_ids.includes(data.ses_user.socket_session.id)
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

    // dont call it directly. call sysHasConvAndSocketSessionRecheck
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
                        room_ids: _.map(convRes.data.conversation_sessions, 'socket_session_id'),
                    };

                    this.roomsInAConv[convId].users_only = convRes.data.users_only;
                }

                return true;
            }
        } catch (e) {
            this.sendError(client, 'ec_recheck_conv', e.response.data);
        }

        return false;
    }

    // dont call it directly
    convIsUserOnly(data: any) {
        return !!this.roomsInAConv[data.conv_id].users_only;
    }

    afterInit(server: Server) {
        console.log('Init');
    }

    async handleConnection(client: Socket, ...args: any[]) {
        console.log(`Socket Client connected: ${client.id}`);

        // if client
        // check the token from client.handshake.query.[token && sessId] and get assigned room which is conversation_id
        // let roomName = room_name
        // this.client.join(roomName)

        let socket_session = null;

        const queryParams = client?.handshake?.query;

        if (queryParams && queryParams.hasOwnProperty('token')) {
            const decodedToken = this.authService.verifyToken(queryParams.token);

            if (decodedToken) {
                socket_session = decodedToken.data.socket_session;
                // console.log(socket_session);
            } else {
                this.sendError(client, 'at_connect', 'token invalid');
            }
        } else {
            this.sendError(client, 'at_connect', 'token invalid');
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
                const userRooms = Object.keys(this.userClientsInARoom).filter(
                    (roomId: any) => this.userClientsInARoom[roomId].sub_id === socket_session.subscriber_id,
                );

                userRooms.forEach((roomId: any) => {
                    this.server.in(roomId).emit('ec_user_logged_in', {
                        user_ses_id: socket_session.id,
                    }); // send to all other users
                });
            }
        }

        if (!this[dynamicInARoom][roomName].socket_client_ids.includes(client.id)) {
            this[dynamicInARoom][roomName].socket_client_ids.push(client.id);
        }

        client.join(roomName);

        console.log('User Clients => ', this.userClientsInARoom);
        console.log('Normal Clients => ', this.normalClientsInARoom);
        console.log('Rooms In Convs => ', this.roomsInAConv);
    }

    handleDisconnect(client: Socket) {
        console.log(`Socket Client disconnected: ${client.id}`);
        // console.log(client?.handshake?.query);

        let socket_session = null;

        const queryParams = client?.handshake?.query;

        if (queryParams && queryParams.hasOwnProperty('token')) {
            const decodedToken = this.authService.verifyToken(queryParams.token);

            if (decodedToken) {
                socket_session = decodedToken.data.socket_session;
                // console.log(socket_session);
            } else {
                this.sendError(client, 'at_connect', 'token invalid');
            }
        } else {
            this.sendError(client, 'at_connect', 'token invalid');
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
                        this.server.in(roomId).emit('ec_user_logged_out', {
                            user_ses_id: socket_session.id,
                        }); // send to all other users
                    });
                }
            }
        }

        console.log('User Clients => ', this.userClientsInARoom);
        console.log('Normal Clients => ', this.normalClientsInARoom);
        console.log('Rooms In Convs => ', this.roomsInAConv);
    }

    sendError(client: any, step: string, msg = 'you are doing something wrong') {
        client.emit('ec_error', {
            type: 'warning',
            step: step,
            reason: msg,
        });
    }
}
