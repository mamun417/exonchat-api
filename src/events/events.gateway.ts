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
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Server, Socket } from 'socket.io';
import * as _ from 'lodash';

@WebSocketGateway({ serveClient: false })
export class EventsGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    // server is eq to socket.io's io
    // client|Socket is eq to socket.io's socket
    // user is webchat user
    // agent is those who handles chat

    private clientsToARoom: any = {}; // users & agents who are in tabs with same session
    private roomsInAConv: any = {};
    private apiToAgents: any = {};

    @SubscribeMessage('ec_agents_online')
    async agentsOnline(@MessageBody() data: any): Promise<number> {
        // this.server.emit('agents-online to client');
        return data;
    }

    @SubscribeMessage('ec_page_visit_info_from_client')
    async pageVisitInfoFromClient(
        @MessageBody() data: any,
        @ConnectedSocket() client: Socket,
    ): Promise<number> {
        const queryParams = client?.handshake?.query;

        if (!queryParams || !queryParams.ses_id || !queryParams.api_key) {
            this.server.to(client.id).emit('ec_error', {
                type: 'warning',
                step: 'ec_page_visit_info_from_client',
                reason: 'handshake params are not set properly',
            });

            return;
        }

        const agentRooms = Object.keys(this.clientsToARoom).filter(
            (roomId: any) => {
                return (
                    this.clientsToARoom[roomId].client_type === 'agent' &&
                    this.clientsToARoom[roomId].api_key === queryParams.api_key
                );
            },
        );

        // console.log(agentRooms);

        agentRooms.forEach((roomId: any) => {
            this.server
                .in(this.clientsToARoom[roomId])
                .emit('ec_page_visit_info_from_client', {
                    url: data.url,
                    sent_at: data.sent_at,
                }); // send to all agents
        });

        return;
    }

    @SubscribeMessage('ec_init_conv_from_user')
    async initialize_conversation(
        @MessageBody() data: number,
        @ConnectedSocket() client: Socket,
    ): Promise<number> {
        // this.server.emit('msg to client');
        const queryParams = client?.handshake?.query;

        if (!queryParams || !queryParams.ses_id || !queryParams.api_key) {
            this.server.to(client.id).emit('ec_error', {
                type: 'warning',
                step: 'ec_init_conv_from_user',
                reason: 'handshake params are not set properly',
            });

            return;
        }

        const conv_id = '123'; // get from api
        const roomName = queryParams.ses_id;

        if (!this.roomsInAConv.hasOwnProperty(conv_id)) {
            this.roomsInAConv[conv_id] = { room_ids: [roomName] };
        } else {
            this.server.to(client.id).emit('ec_error', {
                type: 'error',
                step: 'ec_init_conv_from_user',
                reason: 'conv id already exists',
            });

            return;
        }

        this.server.in(roomName).emit('ec_conv_initiated_from_client', {
            data: {
                conv_id: '123',
            },
            status: 'success',
        });

        // if api error
        // this.server.to(client.id).emit('ec_error', {
        //     type: 'warning',
        //     step: 'at_join_conversation',
        //     reason: 'err.msg',
        // });

        console.log(this.roomsInAConv);

        return;
    }

    @SubscribeMessage('ec_join_conversation')
    async joinConversation(
        @MessageBody() data: any,
        @ConnectedSocket() client: Socket,
    ): Promise<number> {
        const queryParams = client?.handshake?.query;

        if (!queryParams || !queryParams.ses_id || !queryParams.api_key) {
            this.server.to(client.id).emit('ec_error', {
                type: 'error',
                step: 'ec_join_conversation',
                reason: 'handshake params are not set properly',
            });

            return;
        }

        if (!data.conv_id) {
            this.server.to(client.id).emit('ec_error', {
                type: 'error',
                step: 'ec_join_conversation',
                reason: 'conv_id not found',
            });

            return;
        }

        // call check api for conv_id, api_key & ses_id
        const agent_info = {}; //get agent info

        const roomName = queryParams.ses_id;

        // call join conversation api and get msg. there will handle join limit also
        // if done
        if (this.roomsInAConv.hasOwnProperty(data.conv_id)) {
            this.roomsInAConv[data.conv_id].room_ids.push(queryParams.ses_id);

            this.roomsInAConv[data.conv_id].room_ids.forEach((room: any) => {
                this.server.in(room).emit('ec_is_joined_from_conversation', {
                    data: {
                        ...agent_info,
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
    async leaveConversation(
        @MessageBody() data: any,
        @ConnectedSocket() client: Socket,
    ): Promise<number> {
        const queryParams = client?.handshake?.query;

        if (!queryParams || !queryParams.ses_id || !queryParams.api_key) {
            this.server.to(client.id).emit('ec_error', {
                type: 'error',
                step: 'ec_leave_conversation',
                reason: 'handshake params are not set properly',
            });

            return;
        }

        if (!data.conv_id) {
            this.server.to(client.id).emit('ec_error', {
                type: 'error',
                step: 'ec_leave_conversation',
                reason: 'conv_id not found',
            });

            return;
        }

        // call check api for conv_id, api_key & ses_id

        const roomName = queryParams.ses_id;

        if (this.roomsInAConv.hasOwnProperty(queryParams.conv_id)) {
            // clone before remove so that we have all rooms to inform
            const roomsInAConvCopy = _.cloneDeep(this.roomsInAConv);

            _.remove(
                this.roomsInAConv[queryParams.conv_id].room_ids,
                (item: any) => item === queryParams.ses_id,
            );

            roomsInAConvCopy[data.conv_id].room_ids.forEach((room: any) => {
                this.server.in(room).emit('ec_is_leaved_from_conversation', {
                    data: {},
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
    async closeConversation(
        @MessageBody() data: any,
        @ConnectedSocket() client: Socket,
    ): Promise<number> {
        const queryParams = client?.handshake?.query;

        if (!queryParams || !queryParams.ses_id || !queryParams.api_key) {
            this.server.to(client.id).emit('ec_error', {
                type: 'error',
                step: 'ec_close_conversation',
                reason: 'handshake params are not set properly',
            });

            return;
        }

        if (!data.conv_id) {
            this.server.to(client.id).emit('ec_error', {
                type: 'error',
                step: 'ec_close_conversation',
                reason: 'conv_id not found',
            });

            return;
        }

        // call check api for conv_id, api_key & ses_id

        const roomName = queryParams.ses_id;

        if (this.roomsInAConv.hasOwnProperty(queryParams.conv_id)) {
            // clone before remove so that we have all rooms to inform
            const roomsInAConvCopy = _.cloneDeep(this.roomsInAConv);

            delete this.roomsInAConv[data.conv_id];

            roomsInAConvCopy[data.conv_id].room_ids.forEach((room: any) => {
                this.server.in(room).emit('ec_is_leaved_from_conversation', {
                    data: {},
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

    @SubscribeMessage('ec_is_typing_from_client')
    async typingFromClient(
        @MessageBody() data: any,
        @ConnectedSocket() client: Socket,
    ): Promise<number> {
        const queryParams = client?.handshake?.query;

        if (!queryParams || !queryParams.ses_id || !queryParams.api_key) {
            this.server.to(client.id).emit('ec_error', {
                type: 'warning',
                step: 'ec_is_typing_from_client',
                reason: 'handshake params are not set properly',
            });

            return;
        }

        const convId = _.findKey(this.roomsInAConv, (convObj: any) => {
            return convObj.room_ids.includes(queryParams.ses_id);
        }); // get conv_id from ses id

        const agentRooms = Object.keys(this.clientsToARoom).filter(
            (roomId: any) => {
                return (
                    this.clientsToARoom[roomId].client_type === 'agent' &&
                    this.clientsToARoom[roomId].api_key === queryParams.api_key
                );
            },
        );

        // console.log(agentRooms);

        agentRooms.forEach((roomId: any) => {
            this.server
                .in(this.clientsToARoom[roomId])
                .emit('ec_is_typing_from_client', {
                    conv_id: convId,
                    msg: data.msg,
                    sent_at: data.sent_at,
                }); // send to all agents
        });

        // use if needed
        // this.server
        //     .in(this.clientsToARoom[queryParams.ses_id])
        //     .emit('ec_is_typing_to_client', {
        //         msg: data.msg,
        //         sent_at: data.sent_at,
        //         return_type: 'own',
        //     }); // return back to client so that we can update to all tab

        return;
    }

    @SubscribeMessage('ec_msg_from_client')
    async msgFromClient(
        @MessageBody() data: any,
        @ConnectedSocket() client: Socket,
    ): Promise<number> {
        const queryParams = client?.handshake?.query;

        if (!queryParams || !queryParams.ses_id || !queryParams.api_key) {
            this.server.to(client.id).emit('ec_error', {
                type: 'warning',
                step: 'ec_msg_from_client',
                reason: 'handshake params are not set properly',
            });

            return;
        }

        const convId = _.findKey(this.roomsInAConv, (convObj: any) => {
            return convObj.room_ids.includes(queryParams.ses_id);
        }); // get conv_id from ses id

        const agentRooms = Object.keys(this.clientsToARoom).filter(
            (roomId: any) => {
                return (
                    this.clientsToARoom[roomId].client_type === 'agent' &&
                    this.clientsToARoom[roomId].api_key === queryParams.api_key
                );
            },
        );

        // console.log(agentRooms);

        agentRooms.forEach((roomId: any) => {
            this.server
                .in(this.clientsToARoom[roomId])
                .emit('ec_msg_from_client', {
                    conv_id: convId,
                    msg: data.msg,
                    sent_at: data.sent_at,
                }); // send to all agents
        });

        // use if needed
        // this.server
        //     .in(this.clientsToARoom[queryParams.ses_id])
        //     .emit('ec_msg_to_client', {
        //         msg: data.msg,
        //         sent_at: data.sent_at,
        //         return_type: 'own',
        //     }); // return back to client so that we can update to all tab

        return;
    }

    @SubscribeMessage('ec_is_typing_from_agent')
    async typingFromAgent(
        @MessageBody() data: any,
        @ConnectedSocket() client: Socket,
    ): Promise<number> {
        const queryParams = client?.handshake?.query;

        if (!queryParams || !queryParams.ses_id || !queryParams.api_key) {
            this.server.to(client.id).emit('ec_error', {
                type: 'warning',
                step: 'ec_is_typing_from_agent',
                reason: 'handshake params are not set properly',
            });

            return;
        }

        const convId = _.findKey(this.roomsInAConv, (convObj: any) => {
            return convObj.room_ids.includes(queryParams.ses_id);
        }); // get conv_id from ses id

        const agentRooms = Object.keys(this.clientsToARoom).filter(
            (roomId: any) => {
                return (
                    !this.clientsToARoom[roomId].client_ids.includes(
                        client.id, // ignore from same agent
                    ) &&
                    this.clientsToARoom[roomId].client_type === 'agent' &&
                    this.clientsToARoom[roomId].api_key === queryParams.api_key
                );
            },
        );

        // console.log(agentRooms);

        agentRooms.forEach((roomId: any) => {
            this.server
                .in(this.clientsToARoom[roomId])
                .emit('ec_is_typing_from_agent', {
                    conv_id: convId,
                    sent_at: data.sent_at,
                }); // send to all agents without own agent
        });

        // use if needed
        // this.server
        //     .in(this.clientsToARoom[queryParams.ses_id])
        //     .emit('ec_is_typing_to_agent', {
        //         sent_at: data.sent_at,
        //         return_type: 'own',
        //     }); // return back to client so that we can update to all tab

        return;
    }

    @SubscribeMessage('ec_msg_from_agent')
    async msgFromAgent(
        @MessageBody() data: any,
        @ConnectedSocket() client: Socket,
    ): Promise<number> {
        const queryParams = client?.handshake?.query;

        if (!queryParams || !queryParams.ses_id || !queryParams.api_key) {
            this.server.to(client.id).emit('ec_error', {
                type: 'warning',
                step: 'ec_msg_from_agent',
                reason: 'handshake params are not set properly',
            });

            return;
        }

        const convId = _.findKey(this.roomsInAConv, (convObj: any) => {
            return convObj.room_ids.includes(queryParams.ses_id);
        }); // get conv_id from ses id

        const agentRooms = Object.keys(this.clientsToARoom).filter(
            (roomId: any) => {
                return (
                    !this.clientsToARoom[roomId].client_ids.includes(
                        client.id, // ignore from same agent
                    ) &&
                    this.clientsToARoom[roomId].client_type === 'agent' &&
                    this.clientsToARoom[roomId].api_key === queryParams.api_key
                );
            },
        );

        // console.log(agentRooms);

        agentRooms.forEach((roomId: any) => {
            this.server
                .in(this.clientsToARoom[roomId])
                .emit('ec_msg_from_agent', {
                    conv_id: convId,
                    msg: data.msg,
                    sent_at: data.sent_at,
                }); // send to all agents
        });

        // use if needed
        // this.server
        //     .in(this.clientsToARoom[queryParams.ses_id])
        //     .emit('ec_msg_to_agent', {
        //         msg: data.msg,
        //         sent_at: data.sent_at,
        //         return_type: 'own',
        //     }); // return back to client so that we can update to all tab

        return;
    }

    afterInit(server: Server) {
        console.log('Init');
    }

    handleConnection(client: Socket, ...args: any[]) {
        console.log(`Client connected: ${client.id}`);

        // if client
        // check the token from client.handshake.query.[token && sessId] and get assigned room which is conversation_id
        // let roomName = room_name
        // this.client.join(roomName)

        const queryParams = client?.handshake?.query;

        if (!queryParams || !queryParams.ses_id || !queryParams.api_key) {
            this.server.to(client.id).emit('ec_error', {
                type: 'error',
                step: 'at_connect',
                reason: 'handshake params are not set properly',
            });

            return;
        }

        const roomName = queryParams.ses_id;

        // check client type from api
        const clientType = queryParams.client_type
            ? queryParams.client_type
            : 'client';

        // make these like {
        // 'sesid<clients browser assigned-id>: {
        //     client-ids: [<client-ids>],
        //     client-type: '<user|agent>',
        //     api-key: 'it will handle to which user|agent rooms to send'
        // }
        // }

        if (!this.clientsToARoom.hasOwnProperty(roomName)) {
            this.clientsToARoom[roomName] = {
                client_ids: [],
                client_type: clientType,
                api_key: queryParams.api_key,
            };
        }

        if (!this.clientsToARoom[roomName].client_ids.includes(client.id)) {
            this.clientsToARoom[roomName].client_ids.push(client.id);
        }

        client.join(roomName);

        console.log(this.clientsToARoom);

        //if agent
        // save to this.apiToAgents = client.id
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
        // console.log(client?.handshake?.query);

        const queryParams = client?.handshake?.query;

        if (!queryParams || !queryParams.ses_id || !queryParams.api_key) {
            this.server.to(client.id).emit('ec_error', {
                type: 'error',
                step: 'at_disconnect',
                reason: 'handshake params are not set properly',
            });

            return;
        }

        const roomName = queryParams.ses_id;

        if (this.clientsToARoom.hasOwnProperty(roomName)) {
            _.remove(
                this.clientsToARoom[roomName].client_ids,
                (item: any) => item === client.id,
            );

            if (!this.clientsToARoom[roomName].client_ids.length) {
                delete this.clientsToARoom[roomName];
            }

            client.leave(roomName);
        }

        console.log(this.clientsToARoom);
    }
}
