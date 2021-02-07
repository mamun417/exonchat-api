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
    private roomsInAConversation: any = {};
    private apiToAgents: any = {};

    @SubscribeMessage('agents-online')
    async agentsOnline(@MessageBody() data: any): Promise<number> {
        // this.server.emit('agents-online to client');
        return data;
    }

    @SubscribeMessage('joined_conversation')
    async joinedConversation(
        @MessageBody() data: number,
        @ConnectedSocket() client: Socket,
    ): Promise<number> {
        // this.server.emit('msg to client');
        const queryParams = client?.handshake?.query;

        if (
            !queryParams ||
            !queryParams.client_type ||
            !queryParams.ses_id ||
            !queryParams.api_key
        ) {
            this.server.to(client.id).emit('error', {
                type: 'warning',
                step: 'at_join_conversation',
                reason: 'handshake params are not set properly',
            });
        }

        // call join conversation api and get msg. there will handle join limit also
        // if done
        if (this.roomsInAConversation.hasOwnProperty(queryParams.conv_id)) {
            this.roomsInAConversation[queryParams.conv_id].room_ids.push(
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

        if (
            !queryParams ||
            !queryParams.client_type ||
            !queryParams.ses_id ||
            !queryParams.api_key
        ) {
            this.server.to(client.id).emit('error', {
                type: 'warning',
                step: 'at_leave_conversation',
                reason: 'handshake params are not set properly',
            });
        }

        // call leave conversation api and get msg
        // if done
        if (this.roomsInAConversation.hasOwnProperty(queryParams.conv_id)) {
            _.remove(
                this.roomsInAConversation[queryParams.conv_id].room_ids,
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

        if (
            !queryParams ||
            !queryParams.client_type ||
            !queryParams.ses_id ||
            !queryParams.api_key ||
            !queryParams.conv_id
        ) {
            this.server.to(client.id).emit('error', {
                type: 'warning',
                step: 'at_connect',
                reason: 'handshake params are not set properly',
            });
        }

        const roomName = queryParams.ses_id;

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
                client_type: queryParams.client_type,
            };

            this.roomsInAConversation[queryParams.conv_id] = {
                room_ids: [roomName],
            };
        }

        if (!this.clientsToARoom[roomName].client_ids.includes(client.id)) {
            this.clientsToARoom[roomName].client_ids.push(client.id);
        }

        console.log(this.clientsToARoom);

        //if agent
        // save to this.apiToAgents = client.id
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
        // console.log(client?.handshake?.query);

        const queryParams = client?.handshake?.query;

        if (
            !queryParams ||
            !queryParams.client_type ||
            !queryParams.ses_id ||
            !queryParams.api_key ||
            !queryParams.conv_id
        ) {
            this.server.to(client.id).emit('error', {
                type: 'warning',
                step: 'at_disconnect',
                reason: 'handshake params are not set properly',
            });
        }

        const roomName = queryParams.ses_id;

        if (this.clientsToARoom.hasOwnProperty(roomName)) {
            _.remove(
                this.clientsToARoom[roomName].client_ids,
                (item: any) => item === client.id,
            );

            if (!this.clientsToARoom[roomName].client_ids.length) {
                delete this.clientsToARoom[roomName];

                delete this.roomsInAConversation[queryParams.conv_id];
                // call conversation close api
            }
        }

        console.log(this.clientsToARoom);
    }
}
