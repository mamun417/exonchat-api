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

    private userClientsInARoom: any = {}; // users/agents
    private normalClientsInARoom: any = {}; // normal clients from site web-chat
    private roomsInAConv: any = {};

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
            console.log(e.response.data);

            this.sendError(client, 'ec_reload_user_to_user_chat', e.response.data);

            return;
        }

        const roomName = data.ses_user.id;

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
            console.log(e.response.data);

            this.sendError(client, 'ec_init_conv_from_user', e.response.data);

            return;
        }

        const roomName = data.ses_user.id;

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

        console.log(this.roomsInAConv);

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
                    },
                    { headers: { Authorization: `Bearer ${client.handshake.query.token}` } },
                )
                .toPromise();

            conv_data = convRes.data;
            conv_id = convRes.data.id;
        } catch (e) {
            console.log(e.response.data);

            this.sendError(client, 'ec_init_conv_from_client', e.response.data);

            return;
        }

        const roomName = data.ses_user.id;

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

        console.log(this.roomsInAConv);

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_join_conversation')
    async joinConversation(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
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

            // if join then turn off ai reply
            if (
                this.roomsInAConv[data.conv_id].hasOwnProperty('ai_is_replying') &&
                this.roomsInAConv[data.conv_id].ai_is_replying
            ) {
                this.roomsInAConv[data.conv_id].ai_is_replying = false;
            }
        } catch (e) {
            console.log(e.response.data);

            this.server.to(client.id).emit('ec_error', {
                type: 'error',
                step: 'ec_join_conversation',
                reason: e.response.data,
            });

            return;
        }

        // call check api for conv_id, sub_id & ses_id
        const user_info = {}; //get user info

        const roomName = data.ses_user.id;

        // call join conversation api and get msg. there will handle join limit also
        // if done
        if (this.roomsInAConv.hasOwnProperty(data.conv_id)) {
            if (!this.roomsInAConv[data.conv_id].room_ids.includes(data.ses_user.id)) {
                this.roomsInAConv[data.conv_id].room_ids.push(data.ses_user.id);
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

        console.log(this.roomsInAConv);

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_leave_conversation')
    async leaveConversation(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
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
            console.log(e.response.data);

            this.server.to(client.id).emit('ec_error', {
                type: 'error',
                step: 'ec_leave_conversation',
                reason: e.response.data,
            });

            return;
        }

        // call check api for conv_id, sub_id & ses_id

        const roomName = data.ses_user.id;

        console.log(this.roomsInAConv);

        if (this.roomsInAConv.hasOwnProperty(data.conv_id)) {
            // clone before remove so that we have all rooms to inform
            const roomsInAConvCopy = _.cloneDeep(this.roomsInAConv);
            _.remove(this.roomsInAConv[data.conv_id].room_ids, (item: any) => item === data.ses_user.id);

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
            console.log(e.response.data);

            this.server.to(client.id).emit('ec_error', {
                type: 'error',
                step: 'ec_close_conversation',
                reason: e.response.data,
            });

            return;
        }

        // call check api for conv_id, sub_id & ses_id

        const roomName = data.ses_user.id;

        if (this.roomsInAConv.hasOwnProperty(data.conv_id)) {
            // clone before remove so that we have all rooms to inform

            const userRooms = Object.keys(this.userClientsInARoom).filter(
                (roomId: any) => this.userClientsInARoom[roomId].sub_id === data.ses_user.subscriber_id,
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
            return convObj.room_ids.includes(data.ses_user.id);
        }); // get conv_id from ses id

        // get all users with the sub_id
        const userRooms = Object.keys(this.userClientsInARoom).filter(
            (roomId: any) => this.userClientsInARoom[roomId].sub_id === data.ses_user.subscriber_id,
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
        this.server.in(data.ses_user.id).emit('ec_is_typing_to_client', {
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
        const convId = _.findKey(this.roomsInAConv, (convObj: any) => {
            return convObj.room_ids.includes(data.ses_user.id);
        }); // get conv_id from ses id

        // get all users with the sub_id
        const userRooms = Object.keys(this.userClientsInARoom).filter(
            (roomId: any) => this.userClientsInARoom[roomId].sub_id === data.ses_user.subscriber_id,
        );

        let createdMsg: any = null;

        try {
            const msgRes = await this.httpService
                .post(
                    `http://localhost:3000/messages`,
                    {
                        conv_id: convId,
                        msg: data.msg,
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

        if (!this.roomsInAConv[convId].hasOwnProperty('ai_is_replying') || this.roomsInAConv[convId].ai_is_replying) {
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
                    this.roomsInAConv[convId].ai_is_replying =
                        aiReplyMsg.hasOwnProperty('ai_resolved') && aiReplyMsg.ai_resolved;
                }
            } catch (e) {
                console.log(e.response.data, 'ai_error');

                // this.server.to(client.id).emit('ec_error', {
                //     type: 'ai_error',
                //     step: 'ec_msg_from_client',
                //     reason: e.response.data,
                // });

                // return;
            }
        }

        // send to all connected users
        userRooms.forEach((roomId: any) => {
            // for ai is replying check also reply res is not for null content
            this.server.in(roomId).emit('ec_msg_from_client', {
                ...createdMsg,
                temp_id: data.temp_id,
                ai_is_replying: aiReplyMsg && aiReplyMsg.hasOwnProperty('ai_resolved') && aiReplyMsg.ai_resolved,
            }); // send to all users

            if (aiReplyMsg) {
                this.server.in(roomId).emit('ec_reply_from_ai', {
                    ...aiReplyMsg,
                    ai_is_replying: aiReplyMsg.hasOwnProperty('ai_resolved') && aiReplyMsg.ai_resolved,
                });
            }
        });

        // use if needed
        this.server.in(data.ses_user.id).emit('ec_msg_to_client', {
            ...createdMsg,
            temp_id: data.temp_id,
            return_type: 'own',
        }); // return back to client so that we can update to all tab

        if (aiReplyMsg) {
            this.server.in(data.ses_user.id).emit('ec_reply_from_ai', {
                ...aiReplyMsg,
            });
        }

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_is_typing_from_user')
    async typingFromuser(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        if (
            this.roomsInAConv.hasOwnProperty(data.conv_id) &&
            this.roomsInAConv[data.conv_id].room_ids.includes(data.ses_user.id)
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
        this.server.in(data.ses_user.id).emit('ec_is_typing_to_user', {
            conversation_id: data.conv_id,
            msg: data.msg,
            temp_id: data.temp_id,
            return_type: 'own',
        }); // return back to client so that we can update to all tab

        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('ec_msg_from_user')
    async msgFromuser(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        if (
            this.roomsInAConv.hasOwnProperty(data.conv_id) &&
            this.roomsInAConv[data.conv_id].room_ids.includes(data.ses_user.id)
        ) {
            // check if the conv only for users
            // if for users send to only those conv rooms
            // else send to every other users then the client

            const convObj = this.roomsInAConv[data.conv_id];

            let createdMsg: any = null;

            try {
                const msgRes = await this.httpService
                    .post(
                        `http://localhost:3000/messages`,
                        {
                            conv_id: data.conv_id,
                            msg: data.msg,
                        },
                        { headers: { Authorization: `Bearer ${client.handshake.query.token}` } },
                    )
                    .toPromise();

                createdMsg = msgRes.data;
            } catch (e) {
                this.server.to(client.id).emit('ec_error', {
                    type: 'error',
                    step: 'ec_leave_conversation',
                    reason: e.response.data,
                });

                return;
            }

            if (convObj.hasOwnProperty('users_only') && convObj.users_only) {
                const usersRooms = convObj.room_ids.filter((roomId: any) => data.ses_user.id !== roomId);

                // for user to user chat only one will contain & for other many
                usersRooms.forEach((roomId: any) => {
                    this.server.in(roomId).emit('ec_msg_from_user', {
                        ...createdMsg,
                        temp_id: data.temp_id,
                    }); // send to all other users
                });
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
                        this.server.in(roomId).emit('ec_msg_from_user', {
                            ...createdMsg,
                            temp_id: data.temp_id,
                        });
                    });
                } else {
                    this.sendError(client, 'ec_msg_from_user', 'somehow client is not present in this conversation');

                    return;
                }

                userRooms.forEach((roomId: any) => {
                    this.server.in(roomId).emit('ec_msg_from_user', {
                        ...createdMsg,
                        temp_id: data.temp_id,
                    }); // send to all other users
                });
            }

            // use if needed
            this.server.in(data.ses_user.id).emit('ec_msg_to_user', {
                ...createdMsg,
                temp_id: data.temp_id,
                return_type: 'own',
            }); // return back to client so that we can update to all tab
        } else {
            this.sendError(client, 'ec_msg_from_user');
        }

        return;
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

        let ses_user = null;

        const queryParams = client?.handshake?.query;

        if (queryParams && queryParams.hasOwnProperty('token')) {
            const decodedToken = this.authService.verifyToken(queryParams.token);

            if (decodedToken) {
                ses_user = decodedToken.data;
                console.log(ses_user);
            } else {
                this.sendError(client, 'at_connect', 'token invalid');
            }
        } else {
            this.sendError(client, 'at_connect', 'token invalid');
        }

        const roomName = ses_user.id;

        // check client type from api
        const dynamicInARoom = queryParams.client_type === 'user' ? 'userClientsInARoom' : 'normalClientsInARoom';

        if (!this[dynamicInARoom].hasOwnProperty(roomName)) {
            this[dynamicInARoom][roomName] = {
                socket_client_ids: [],
                sub_id: ses_user.subscriber_id,
            };

            if (queryParams.client_type === 'user') {
                const userRooms = Object.keys(this.userClientsInARoom).filter(
                    (roomId: any) => this.userClientsInARoom[roomId].sub_id === ses_user.subscriber_id,
                );

                userRooms.forEach((roomId: any) => {
                    this.server.in(roomId).emit('ec_user_logged_in', {
                        user_ses_id: ses_user.id,
                    }); // send to all other users
                });
            }
        }

        if (!this[dynamicInARoom][roomName].socket_client_ids.includes(client.id)) {
            this[dynamicInARoom][roomName].socket_client_ids.push(client.id);
        }

        client.join(roomName);

        console.log(this.userClientsInARoom);
        console.log(this.normalClientsInARoom);
        console.log(this.roomsInAConv);
    }

    handleDisconnect(client: Socket) {
        console.log(`Socket Client disconnected: ${client.id}`);
        // console.log(client?.handshake?.query);

        let ses_user = null;

        const queryParams = client?.handshake?.query;

        if (queryParams && queryParams.hasOwnProperty('token')) {
            const decodedToken = this.authService.verifyToken(queryParams.token);

            if (decodedToken) {
                ses_user = decodedToken.data;
                console.log(ses_user);
            } else {
                this.sendError(client, 'at_connect', 'token invalid');
            }
        } else {
            this.sendError(client, 'at_connect', 'token invalid');
        }

        const roomName = ses_user.id;

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
                        (roomId: any) => this.userClientsInARoom[roomId].sub_id === ses_user.subscriber_id,
                    );

                    userRooms.forEach((roomId: any) => {
                        this.server.in(roomId).emit('ec_user_logged_out', {
                            user_ses_id: ses_user.id,
                        }); // send to all other users
                    });
                }
            }
        }

        console.log(this.userClientsInARoom);
        console.log(this.normalClientsInARoom);
        console.log(this.roomsInAConv);
    }

    sendError(client: any, step: string, msg = 'you are doing something wrong') {
        client.emit('ec_error', {
            type: 'warning',
            step: step,
            reason: msg,
        });
    }
}
