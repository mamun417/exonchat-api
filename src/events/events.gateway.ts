import { HttpService } from '@nestjs/common';
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

@WebSocketGateway({ serveClient: false })
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    constructor(private httpService: HttpService) {}

    @WebSocketServer()
    server: Server;

    // server is eq to socket.io's io
    // client|Socket is eq to socket.io's socket

    // client is webchat user
    // user = user/agent

    private userClientsInARoom: any = {}; // users/agents
    private normalClientsInARoom: any = {}; // normal clients from site web-chat
    private roomsInAConv: any = {};

    @SubscribeMessage('ec_get_logged_users') // get users list when needed
    async usersOnline(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        const queryParams = client?.handshake?.query;

        if (!this.queryParamsOk(client, queryParams, 'ec_get_logged_users')) return;

        // get all logged users with the api_key
        const users = Object.keys(this.userClientsInARoom).filter(
            (roomId: any) => this.userClientsInARoom[roomId].api_key === queryParams.api_key,
        );

        this.server.to(client.id).emit('ec_logged_users_res', {
            users: users,
        });

        return;
    }

    @SubscribeMessage('ec_page_visit_info_from_client')
    async pageVisitInfoFromClient(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        const queryParams = client?.handshake?.query;

        if (!this.queryParamsOk(client, queryParams, 'ec_page_visit_info_from_client')) return;

        const userRooms = Object.keys(this.userClientsInARoom).filter(
            (roomId: any) => this.userClientsInARoom[roomId].api_key === queryParams.api_key,
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

    @SubscribeMessage('ec_init_conv_from_user')
    async init_conversation_from_user(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        const queryParams = client?.handshake?.query;

        if (!this.queryParamsOk(client, queryParams, 'ec_init_conv_from_user')) return;

        const conv_id = '123'; // get from api
        const roomName = queryParams.ses_id;

        if (!this.roomsInAConv.hasOwnProperty(conv_id)) {
            this.roomsInAConv[conv_id] = { room_ids: [roomName] };

            if (data.users_only) {
                this.roomsInAConv[conv_id].users_only = true;
            }
        } else {
            this.server.to(client.id).emit('ec_error', {
                type: 'error',
                step: 'ec_init_conv_from_user',
                reason: 'conv id already exists',
            });

            return;
        }

        this.server.in(roomName).emit('ec_conv_initiated_from_user', {
            data: {
                conv_id: '123',
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

    @SubscribeMessage('ec_init_conv_from_client')
    async init_conversation_from_client(
        @MessageBody() data: number,
        @ConnectedSocket() client: Socket,
    ): Promise<number> {
        const queryParams = client?.handshake?.query;

        if (!this.queryParamsOk(client, queryParams, 'ec_init_conv_from_client')) return;

        let conv_data = null;
        let conv_id = null;

        try {
            const convRes: any = await this.httpService
                .post('http://localhost:3000/conversations', {
                    api_key: queryParams.api_key,
                    ses_id: queryParams.ses_id,
                    chat_type: 'live_chat',
                })
                .toPromise();

            conv_data = convRes.data;
            conv_id = convRes.data.id;
        } catch (e) {
            console.log(e.response.data);

            this.server.to(client.id).emit('ec_error', {
                type: 'error',
                step: 'ec_init_conv_from_client',
                reason: e.response.data,
            });

            return;
        }

        const roomName = queryParams.ses_id;

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

    @SubscribeMessage('ec_join_conversation')
    async joinConversation(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        const queryParams = client?.handshake?.query;

        if (!this.queryParamsOk(client, queryParams, 'ec_join_conversation')) return;

        let conv_ses_data = null;

        try {
            const convSesRes: any = await this.httpService
                .post(`http://localhost:3000/conversations/${data.conv_id}`, {
                    api_key: queryParams.api_key,
                    ses_id: queryParams.ses_id,
                })
                .toPromise();

            conv_ses_data = convSesRes.data;
        } catch (e) {
            console.log(e.response.data);

            this.server.to(client.id).emit('ec_error', {
                type: 'error',
                step: 'ec_join_conversation',
                reason: e.response.data,
            });

            return;
        }

        // call check api for conv_id, api_key & ses_id
        const user_info = {}; //get user info

        const roomName = queryParams.ses_id;

        // call join conversation api and get msg. there will handle join limit also
        // if done
        if (this.roomsInAConv.hasOwnProperty(data.conv_id)) {
            if (!this.roomsInAConv[data.conv_id].room_ids.includes(queryParams.ses_id)) {
                this.roomsInAConv[data.conv_id].room_ids.push(queryParams.ses_id);
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

    @SubscribeMessage('ec_leave_conversation')
    async leaveConversation(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        const queryParams = client?.handshake?.query;

        if (!this.queryParamsOk(client, queryParams, 'ec_leave_conversation')) return;

        let conv_ses_data = null;

        try {
            const convSesRes: any = await this.httpService
                .post(`http://localhost:3000/conversations/${data.conv_id}/leave`, {
                    api_key: queryParams.api_key,
                    ses_id: queryParams.ses_id,
                })
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

        // call check api for conv_id, api_key & ses_id

        const roomName = queryParams.ses_id;

        console.log(this.roomsInAConv);

        if (this.roomsInAConv.hasOwnProperty(data.conv_id)) {
            // clone before remove so that we have all rooms to inform
            const roomsInAConvCopy = _.cloneDeep(this.roomsInAConv);
            _.remove(this.roomsInAConv[data.conv_id].room_ids, (item: any) => item === queryParams.ses_id);

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

    @SubscribeMessage('ec_close_conversation')
    async closeConversation(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        const queryParams = client?.handshake?.query;

        if (!this.queryParamsOk(client, queryParams, 'ec_close_conversation')) return;

        let conv_data = null;
        let conv_id = null;

        try {
            const convRes: any = await this.httpService
                .post(`http://localhost:3000/conversations/${data.conv_id}/close`, {
                    api_key: queryParams.api_key,
                    ses_id: queryParams.ses_id,
                })
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

        // call check api for conv_id, api_key & ses_id

        const roomName = queryParams.ses_id;

        if (this.roomsInAConv.hasOwnProperty(data.conv_id)) {
            // clone before remove so that we have all rooms to inform
            const roomsInAConvCopy = _.cloneDeep(this.roomsInAConv);

            delete this.roomsInAConv[data.conv_id];

            roomsInAConvCopy[data.conv_id].room_ids.forEach((room: any) => {
                this.server.in(room).emit('ec_is_closed_from_conversation', {
                    data: {
                        conv_data,
                        conv_id,
                    },
                    status: 'success',
                });
            });
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

    @SubscribeMessage('ec_is_typing_from_client')
    async typingFromClient(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        const queryParams = client?.handshake?.query;

        if (!this.queryParamsOk(client, queryParams, 'ec_is_typing_from_client')) return;

        const convId = _.findKey(this.roomsInAConv, (convObj: any) => {
            return convObj.room_ids.includes(queryParams.ses_id);
        }); // get conv_id from ses id

        // get all users with the api_key
        const userRooms = Object.keys(this.userClientsInARoom).filter(
            (roomId: any) => this.userClientsInARoom[roomId].api_key === queryParams.api_key,
        );

        // send to all connected users
        userRooms.forEach((roomId: any) => {
            this.server.in(roomId).emit('ec_is_typing_from_client', {
                conv_id: convId,
                msg: data.msg,
                sent_at: data.sent_at,
            }); // send to all users
        });

        // use if needed
        this.server.in(queryParams.ses_id).emit('ec_is_typing_to_client', {
            msg: data.msg,
            sent_at: data.sent_at,
            return_type: 'own',
        }); // return back to client so that we can update to all tab

        return;
    }

    @SubscribeMessage('ec_msg_from_client')
    async msgFromClient(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        const queryParams = client?.handshake?.query;

        if (!this.queryParamsOk(client, queryParams, 'ec_msg_from_client')) return;

        const convId = _.findKey(this.roomsInAConv, (convObj: any) => {
            return convObj.room_ids.includes(queryParams.ses_id);
        }); // get conv_id from ses id

        // get all users with the api_key
        const userRooms = Object.keys(this.userClientsInARoom).filter(
            (roomId: any) => this.userClientsInARoom[roomId].api_key === queryParams.api_key,
        );

        // send to all connected users
        userRooms.forEach((roomId: any) => {
            this.server.in(roomId).emit('ec_msg_from_client', {
                conv_id: convId,
                msg: data.msg,
                sent_at: data.sent_at,
            }); // send to all users
        });

        // use if needed
        this.server.in(queryParams.ses_id).emit('ec_msg_to_client', {
            msg: data.msg,
            sent_at: data.sent_at,
            return_type: 'own',
        }); // return back to client so that we can update to all tab

        return;
    }

    @SubscribeMessage('ec_is_typing_from_user')
    async typingFromuser(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        const queryParams = client?.handshake?.query;

        if (!this.queryParamsOk(client, queryParams, 'ec_is_typing_from_user')) return;

        if (
            this.roomsInAConv.hasOwnProperty(data.conv_id) &&
            this.roomsInAConv[data.conv_id].room_ids.includes(queryParams.ses_id)
        ) {
            const convObj = this.roomsInAConv[data.conv_id];

            if (convObj.hasOwnProperty('users_only') && convObj.users_only) {
                //
            } else {
                const userRooms = Object.keys(this.userClientsInARoom).filter(
                    (roomId: any) =>
                        this.userClientsInARoom[roomId].api_key === queryParams.api_key &&
                        !this.userClientsInARoom[roomId].socket_client_ids.includes(
                            client.id, // ignore from same user
                        ),
                );

                // it will contain single elm for now
                const clientRooms = convObj.room_ids.filter(
                    (roomId: any) => this.normalClientsInARoom[roomId]?.api_key === queryParams.api_key,
                );

                if (clientRooms.length === 1) {
                    clientRooms.forEach((roomId: any) => {
                        this.server.in(roomId).emit('ec_is_typing_from_user', {
                            conv_id: queryParams.conv_id,
                            msg: data.msg,
                            sent_at: data.sent_at,
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
                        conv_id: queryParams.conv_id,
                        msg: data.msg,
                        sent_at: data.sent_at,
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
        this.server.in(queryParams.ses_id).emit('ec_is_typing_to_user', {
            sent_at: data.sent_at,
            return_type: 'own',
        }); // return back to client so that we can update to all tab

        return;
    }

    @SubscribeMessage('ec_msg_from_user')
    async msgFromuser(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        const queryParams = client?.handshake?.query;

        if (!this.queryParamsOk(client, queryParams, 'ec_msg_from_user')) return;

        if (
            this.roomsInAConv.hasOwnProperty(data.conv_id) &&
            this.roomsInAConv[data.conv_id].room_ids.includes(queryParams.ses_id)
        ) {
            // check if the conv only for users
            // if for users send to only those conv rooms
            // else send to every other users then the client

            const convObj = this.roomsInAConv[data.conv_id];

            if (convObj.hasOwnProperty('users_only') && convObj.users_only) {
                //
            } else {
                const userRooms = Object.keys(this.userClientsInARoom).filter(
                    (roomId: any) =>
                        this.userClientsInARoom[roomId].api_key === queryParams.api_key &&
                        !this.userClientsInARoom[roomId].socket_client_ids.includes(
                            client.id, // ignore from same user
                        ),
                );

                // it will contain single elm for now
                const clientRooms = convObj.room_ids.filter(
                    (roomId: any) => this.normalClientsInARoom[roomId]?.api_key === queryParams.api_key,
                );

                if (clientRooms.length === 1) {
                    clientRooms.forEach((roomId: any) => {
                        this.server.in(roomId).emit('ec_msg_from_user', {
                            conv_id: queryParams.conv_id,
                            msg: data.msg,
                            sent_at: data.sent_at,
                        });
                    });
                } else {
                    this.sendError(client, 'ec_msg_from_user', 'somehow client is not present in this conversation');

                    return;
                }

                userRooms.forEach((roomId: any) => {
                    this.server.in(roomId).emit('ec_msg_from_user', {
                        conv_id: queryParams.conv_id,
                        msg: data.msg,
                        sent_at: data.sent_at,
                    }); // send to all other users
                });
            }
        } else {
            this.sendError(client, 'ec_msg_from_user');

            return;
        }

        // use if needed
        this.server.in(queryParams.ses_id).emit('ec_msg_to_user', {
            msg: data.msg,
            sent_at: data.sent_at,
            return_type: 'own',
        }); // return back to client so that we can update to all tab

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

        const queryParams = client?.handshake?.query;

        if (!this.queryParamsOk(client, queryParams, 'at_connect')) return;

        const roomName = queryParams.ses_id;

        // check client type from api
        const dynamicInARoom = queryParams.client_type === 'user' ? 'userClientsInARoom' : 'normalClientsInARoom';

        if (!this[dynamicInARoom].hasOwnProperty(roomName)) {
            this[dynamicInARoom][roomName] = {
                socket_client_ids: [],
                api_key: queryParams.api_key,
            };

            if (queryParams.client_type === 'user') {
                const userRooms = Object.keys(this.userClientsInARoom).filter(
                    (roomId: any) => this.userClientsInARoom[roomId].api_key === queryParams.api_key,
                );

                userRooms.forEach((roomId: any) => {
                    this.server.in(roomId).emit('ec_user_logged_in', {
                        user_ses_id: queryParams.ses_id,
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

        const queryParams = client?.handshake?.query;

        if (!this.queryParamsOk(client, queryParams, 'ec_msg_from_user')) return;

        const roomName = queryParams.ses_id;

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
                        (roomId: any) => this.userClientsInARoom[roomId].api_key === queryParams.api_key,
                    );

                    userRooms.forEach((roomId: any) => {
                        this.server.in(roomId).emit('ec_user_logged_out', {
                            user_ses_id: queryParams.ses_id,
                        }); // send to all other users
                    });
                }
            }
        }

        console.log(this.userClientsInARoom);
        console.log(this.normalClientsInARoom);
        console.log(this.roomsInAConv);
    }

    queryParamsOk(client: any, queryParams: any, step: string) {
        if (!queryParams || !queryParams.ses_id || !queryParams.api_key) {
            this.sendError(client, step, 'handshake params are not set properly');

            return false;
        }

        return true;
    }

    sendError(client: any, step: string, msg = 'you are doing something wrong') {
        this.server.to(client.id).emit('ec_error', {
            type: 'warning',
            step: step,
            reason: msg,
        });
    }
}
