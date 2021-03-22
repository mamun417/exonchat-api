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
    @WebSocketServer()
    server: Server;

    // server is eq to socket.io's io
    // client|Socket is eq to socket.io's socket
    // user is webchat user
    // agent is those who handles chat

    private clientsToARoom: any = {}; // users & agents who are in tabs with same session
    private roomsInAConv: any = {};
    private apiToAgents: any = {};

    @SubscribeMessage('ec_get_agents_online')
    async agentsOnline(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        const queryParams = client?.handshake?.query;

        if (!queryParams || !queryParams.ses_id || !queryParams.api_key) {
            this.server.to(client.id).emit('ec_error', {
                type: 'warning',
                step: 'ec_get_agents_online',
                reason: 'handshake params are not set properly',
            });

            return;
        }

        // get all online agents with the api_key
        const agents = Object.keys(this.clientsToARoom).filter((roomId: any) => {
            return (
                this.clientsToARoom[roomId].client_type === 'agent' &&
                this.clientsToARoom[roomId].api_key === queryParams.api_key
            );
        });

        this.server.to(client.id).emit('ec_agents_online_res', {
            agents: agents,
        });

        return;
    }

    @SubscribeMessage('ec_page_visit_info_from_client')
    async pageVisitInfoFromClient(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        const queryParams = client?.handshake?.query;

        if (!queryParams || !queryParams.ses_id || !queryParams.api_key) {
            this.server.to(client.id).emit('ec_error', {
                type: 'warning',
                step: 'ec_page_visit_info_from_client',
                reason: 'handshake params are not set properly',
            });

            return;
        }

        const agentRooms = Object.keys(this.clientsToARoom).filter((roomId: any) => {
            return (
                this.clientsToARoom[roomId].client_type === 'agent' &&
                this.clientsToARoom[roomId].api_key === queryParams.api_key
            );
        });

        // console.log(agentRooms);

        agentRooms.forEach((roomId: any) => {
            this.server.in(this.clientsToARoom[roomId]).emit('ec_page_visit_info_from_client', {
                url: data.url,
                sent_at: data.sent_at,
            }); // send to all agents
        });

        return;
    }

    @SubscribeMessage('ec_init_conv_from_agent')
    async init_conversation_from_agent(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        const queryParams = client?.handshake?.query;

        if (!queryParams || !queryParams.ses_id || !queryParams.api_key) {
            this.server.to(client.id).emit('ec_error', {
                type: 'warning',
                step: 'ec_init_conv_from_agent',
                reason: 'handshake params are not set properly',
            });

            return;
        }

        const conv_id = '123'; // get from api
        const roomName = queryParams.ses_id;

        if (!this.roomsInAConv.hasOwnProperty(conv_id)) {
            this.roomsInAConv[conv_id] = { room_ids: [roomName] };

            if (data.agents_only) {
                this.roomsInAConv[conv_id].agents_only = true;
            }
        } else {
            this.server.to(client.id).emit('ec_error', {
                type: 'error',
                step: 'ec_init_conv_from_agent',
                reason: 'conv id already exists',
            });

            return;
        }

        this.server.in(roomName).emit('ec_conv_initiated_from_agent', {
            data: {
                conv_id: '123',
            },
            status: 'success',
        });

        // if api error
        // this.server.to(client.id).emit('ec_error', {
        //     type: 'warning',
        //     step: 'ec_conv_initiated_from_agent',
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

        if (!queryParams || !queryParams.ses_id || !queryParams.api_key) {
            this.server.to(client.id).emit('ec_error', {
                type: 'warning',
                step: 'ec_init_conv_from_client',
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
                step: 'ec_init_conv_from_client',
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
        //     step: 'ec_init_conv_from_client',
        //     reason: 'err.msg',
        // });

        console.log(this.roomsInAConv);

        return;
    }

    @SubscribeMessage('ec_join_conversation')
    async joinConversation(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
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
            if (!this.roomsInAConv[data.conv_id].room_ids.includes(queryParams.ses_id)) {
                this.roomsInAConv[data.conv_id].room_ids.push(queryParams.ses_id);
            }

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
    async leaveConversation(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
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

        console.log(this.roomsInAConv);

        if (this.roomsInAConv.hasOwnProperty(data.conv_id)) {
            // clone before remove so that we have all rooms to inform
            const roomsInAConvCopy = _.cloneDeep(this.roomsInAConv);

            _.remove(this.roomsInAConv[data.conv_id].room_ids, (item: any) => item === queryParams.ses_id);

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
    async closeConversation(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
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

        if (this.roomsInAConv.hasOwnProperty(data.conv_id)) {
            // clone before remove so that we have all rooms to inform
            const roomsInAConvCopy = _.cloneDeep(this.roomsInAConv);

            delete this.roomsInAConv[data.conv_id];

            roomsInAConvCopy[data.conv_id].room_ids.forEach((room: any) => {
                this.server.in(room).emit('ec_is_closed_from_conversation', {
                    data: {},
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

        // get all agents with the api_key
        const agentRooms = Object.keys(this.clientsToARoom).filter((roomId: any) => {
            return (
                this.clientsToARoom[roomId].client_type === 'agent' &&
                this.clientsToARoom[roomId].api_key === queryParams.api_key
            );
        });

        // send to all connected agents
        agentRooms.forEach((roomId: any) => {
            this.server.in(roomId).emit('ec_is_typing_from_client', {
                conv_id: convId,
                msg: data.msg,
                sent_at: data.sent_at,
            }); // send to all agents
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

        // get all agents with the api_key
        const agentRooms = Object.keys(this.clientsToARoom).filter((roomId: any) => {
            return (
                this.clientsToARoom[roomId].client_type === 'agent' &&
                this.clientsToARoom[roomId].api_key === queryParams.api_key
            );
        });

        // send to all connected agents
        agentRooms.forEach((roomId: any) => {
            this.server.in(roomId).emit('ec_msg_from_client', {
                conv_id: convId,
                msg: data.msg,
                sent_at: data.sent_at,
            }); // send to all agents
        });

        // use if needed
        this.server.in(queryParams.ses_id).emit('ec_msg_to_client', {
            msg: data.msg,
            sent_at: data.sent_at,
            return_type: 'own',
        }); // return back to client so that we can update to all tab

        return;
    }

    @SubscribeMessage('ec_is_typing_from_agent')
    async typingFromAgent(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        const queryParams = client?.handshake?.query;

        if (!queryParams || !queryParams.ses_id || !queryParams.api_key) {
            this.server.to(client.id).emit('ec_error', {
                type: 'warning',
                step: 'ec_is_typing_from_agent',
                reason: 'handshake params are not set properly',
            });

            return;
        }

        if (
            this.roomsInAConv.hasOwnProperty(data.conv_id) &&
            this.roomsInAConv[data.conv_id].room_ids.includes(queryParams.ses_id)
        ) {
            const convObj = this.roomsInAConv[data.conv_id];

            if (convObj.hasOwnProperty('agents_only') && convObj.agents_only) {
                //
            } else {
                const agentRooms = Object.keys(this.clientsToARoom).filter((roomId: any) => {
                    return (
                        !this.clientsToARoom[roomId].client_ids.includes(
                            client.id, // ignore from same agent
                        ) &&
                        this.clientsToARoom[roomId].client_type === 'agent' &&
                        this.clientsToARoom[roomId].api_key === queryParams.api_key
                    );
                });

                // it will contain single elm for now
                const clientRooms = convObj.room_ids.filter((roomId: any) => {
                    return (
                        this.clientsToARoom[roomId].client_type !== 'agent' &&
                        this.clientsToARoom[roomId].api_key === queryParams.api_key
                    );
                });

                if (clientRooms.length === 1) {
                    clientRooms.forEach((roomId: any) => {
                        this.server.in(roomId).emit('ec_is_typing_from_agent', {
                            conv_id: queryParams.conv_id,
                            msg: data.msg,
                            sent_at: data.sent_at,
                        });
                    });
                } else {
                    this.server.to(client.id).emit('ec_error', {
                        type: 'warning',
                        step: 'ec_is_typing_from_agent',
                        reason: 'Somehow client is not present in this conv',
                    });

                    return;
                }

                agentRooms.forEach((roomId: any) => {
                    this.server.in(roomId).emit('ec_is_typing_from_agent', {
                        conv_id: queryParams.conv_id,
                        msg: data.msg,
                        sent_at: data.sent_at,
                    }); // send to all other agents
                });
            }
        } else {
            this.server.to(client.id).emit('ec_error', {
                type: 'warning',
                step: 'ec_is_typing_from_agent',
                reason: 'You are doing something wrong',
            });

            return;
        }

        // use if needed
        this.server.in(queryParams.ses_id).emit('ec_is_typing_to_agent', {
            sent_at: data.sent_at,
            return_type: 'own',
        }); // return back to client so that we can update to all tab

        return;
    }

    @SubscribeMessage('ec_msg_from_agent')
    async msgFromAgent(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<number> {
        const queryParams = client?.handshake?.query;

        if (!queryParams || !queryParams.ses_id || !queryParams.api_key) {
            this.server.to(client.id).emit('ec_error', {
                type: 'warning',
                step: 'ec_msg_from_agent',
                reason: 'handshake params are not set properly',
            });

            return;
        }

        // check if the conv only for agents
        // if for agents send to only those conv rooms
        // else send to every other agents then the client

        if (
            this.roomsInAConv.hasOwnProperty(data.conv_id) &&
            this.roomsInAConv[data.conv_id].room_ids.includes(queryParams.ses_id)
        ) {
            const convObj = this.roomsInAConv[data.conv_id];

            if (convObj.hasOwnProperty('agents_only') && convObj.agents_only) {
                //
            } else {
                const agentRooms = Object.keys(this.clientsToARoom).filter((roomId: any) => {
                    return (
                        !this.clientsToARoom[roomId].client_ids.includes(
                            client.id, // ignore from same agent
                        ) &&
                        this.clientsToARoom[roomId].client_type === 'agent' &&
                        this.clientsToARoom[roomId].api_key === queryParams.api_key
                    );
                });

                // it will contain single elm for now
                const clientRooms = convObj.room_ids.filter((roomId: any) => {
                    return (
                        this.clientsToARoom[roomId].client_type !== 'agent' &&
                        this.clientsToARoom[roomId].api_key === queryParams.api_key
                    );
                });

                if (clientRooms.length === 1) {
                    clientRooms.forEach((roomId: any) => {
                        this.server.in(roomId).emit('ec_msg_from_agent', {
                            conv_id: queryParams.conv_id,
                            msg: data.msg,
                            sent_at: data.sent_at,
                        });
                    });
                } else {
                    this.server.to(client.id).emit('ec_error', {
                        type: 'warning',
                        step: 'ec_msg_from_agent',
                        reason: 'Somehow client is not present in this conv',
                    });

                    return;
                }

                agentRooms.forEach((roomId: any) => {
                    this.server.in(roomId).emit('ec_msg_from_agent', {
                        conv_id: queryParams.conv_id,
                        msg: data.msg,
                        sent_at: data.sent_at,
                    }); // send to all other agents
                });
            }
        } else {
            this.server.to(client.id).emit('ec_error', {
                type: 'warning',
                step: 'ec_msg_from_agent',
                reason: 'You are doing something wrong',
            });

            return;
        }

        // use if needed
        this.server.in(queryParams.ses_id).emit('ec_msg_to_agent', {
            msg: data.msg,
            sent_at: data.sent_at,
            return_type: 'own',
        }); // return back to client so that we can update to all tab

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
        const clientType = queryParams.client_type ? queryParams.client_type : 'client';

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
        console.log(this.roomsInAConv);

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
            _.remove(this.clientsToARoom[roomName].client_ids, (item: any) => item === client.id);

            if (!this.clientsToARoom[roomName].client_ids.length) {
                delete this.clientsToARoom[roomName];
            }

            client.leave(roomName);
        }

        console.log(this.clientsToARoom);
    }
}
