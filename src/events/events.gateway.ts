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

    private usersToARoom: any = {}; // users who are in tabs with same session
    private apiToAgents: any = {};

    @SubscribeMessage('agents-online')
    async agentsOnline(@MessageBody() data: any): Promise<number> {
        // this.server.emit('agents-online to client');
        return data;
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
            .in(this.usersToARoom[client.id])
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
        const roomName = client?.handshake?.query?.sesId;

        // make these like {
        // 'sesid<clients browser assigned-id>: {
        //     client-ids: [<client-ids>],
        //     client-type: '<user|agent>',
        //     api-key: 'it will handle to which user|agent rooms to send'
        // }
        // }

        if (
            client?.handshake?.query?.client_type === 'user' &&
            !this.usersToARoom.hasOwnProperty(roomName)
        ) {
            this.usersToARoom[roomName] = [];
        }

        if (!this.usersToARoom[roomName].includes(client.id)) {
            this.usersToARoom[roomName].push(client.id);
        }

        console.log(this.usersToARoom);

        //if agent
        // save to this.apiToAgents = client.id
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
        // console.log(client?.handshake?.query);

        const roomName = client?.handshake?.query?.sesId;

        if (
            client?.handshake?.query?.client_type === 'user' &&
            this.usersToARoom.hasOwnProperty(roomName)
        ) {
            const tempUsersInARoom = this.usersToARoom[roomName];
            _.remove(
                this.usersToARoom[roomName],
                (user: any) => user === client.id,
            );

            this.usersToARoom[roomName] = tempUsersInARoom;
        }

        console.log(this.usersToARoom);
    }
}
