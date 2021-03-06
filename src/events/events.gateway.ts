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

    private clientsToARoom: any = {}; // users who are in tabs with same session
    private roomsInAConv: any = {};
    private apiToAgents: any = {};

    @SubscribeMessage('ec_agents_online')
    async agentsOnline(@MessageBody() data: any): Promise<number> {
        // this.server.emit('agents-online to client');
        return data;
    }

    @SubscribeMessage('ec_init_conv_from_user')
    async initialize_conversation(
        @MessageBody() data: number,
        @ConnectedSocket() client: Socket,
    ): Promise<number> {
        // this.server.emit('msg to client');
        const queryParams = client?.handshake?.query;

        if (!queryParams || !queryParams.ses_id || !queryParams.api_key) {
            this.server.to(client.id).emit('error', {
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

        this.server.in(roomName).emit('ec_conv_initiated_from_user', {
            data: {
                conv_id: '123',
            },
            status: 'success',
        });

        // if api error
        // this.server.to(client.id).emit('error', {
        //     type: 'warning',
        //     step: 'at_join_conversation',
        //     reason: 'err.msg',
        // });

        console.log(this.roomsInAConv);

        return;
    }

    @SubscribeMessage('joined_conversation')
    async joinedConversation(
        @MessageBody() data: number,
        @ConnectedSocket() client: Socket,
    ): Promise<number> {
        // this.server.emit('msg to client');
        const queryParams = client?.handshake?.query;

        if (!queryParams || !queryParams.ses_id || !queryParams.api_key) {
            this.server.to(client.id).emit('error', {
                type: 'warning',
                step: 'at_join_conversation',
                reason: 'handshake params are not set properly',
            });

            return;
        }

        // call join conversation api and get msg. there will handle join limit also
        // if done
        if (this.roomsInAConv.hasOwnProperty(queryParams.conv_id)) {
            this.roomsInAConv[queryParams.conv_id].room_ids.push(
                queryParams.ses_id,
            );
        }

        // if api error
        // this.server.to(client.id).emit('error', {
        //     type: 'warning',
        //     step: 'at_join_conversation',
        //     reason: 'err.msg',
        // });

        return;
    }

    @SubscribeMessage('leaved_conversation')
    async leavedConversation(
        @MessageBody() data: number,
        @ConnectedSocket() client: Socket,
    ): Promise<number> {
        // this.server.emit('msg to client');
        const queryParams = client?.handshake?.query;

        if (!queryParams || !queryParams.ses_id || !queryParams.api_key) {
            this.server.to(client.id).emit('error', {
                type: 'warning',
                step: 'at_leave_conversation',
                reason: 'handshake params are not set properly',
            });

            return;
        }

        // call leave conversation api and get msg
        // if done
        if (this.roomsInAConv.hasOwnProperty(queryParams.conv_id)) {
            _.remove(
                this.roomsInAConv[queryParams.conv_id].room_ids,
                (item: any) => item === queryParams.ses_id,
            );
        }

        // if api error
        // this.server.to(client.id).emit('error', {
        //     type: 'warning',
        //     step: 'at_leave_conversation',
        //     reason: 'err.msg',
        // });

        return;
    }

    @SubscribeMessage('message')
    async message(
        @MessageBody() data: number,
        @ConnectedSocket() client: Socket,
    ): Promise<number> {
        // this.server.emit('msg to client');
        console.log(data);

        return;
    }

    @SubscribeMessage('exonchat_msg_from_user')
    async webchatNewMsg(
        @MessageBody() data: any,
        @ConnectedSocket() client: Socket,
    ): Promise<number> {
        this.server
            .in(this.clientsToARoom[client.id])
            .emit('exonchat_msg_to_user', {
                msg: data.msg,
                sentByClient: true,
            }); // send to room also with sender

        // loop through all client.id present in this.apiToAgents[client.handshake.query.api]
        // this.server.to(client.id).emit('new-message-to-agents', { data });

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
            this.server.to(client.id).emit('error', {
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
            this.server.to(client.id).emit('error', {
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
