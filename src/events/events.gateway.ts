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

@WebSocketGateway({ transports: ['websocket'], serveClient: false })
export class EventsGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    // server is eq to socket.io's io
    // client|Socket is eq to socket.io's socket

    private clientsToRoom: any = {};
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

    @SubscribeMessage('webchat-new-message')
    async whebchatNewMsg(
        @MessageBody() data: any,
        @ConnectedSocket() client: Socket,
    ): Promise<number> {
        this.server
            .in(this.clientsToRoom[client.id])
            .emit('message', { msg: data.msg, sentByClient: true }); // send to room also with sender

        // loop through all client.id present in this.apiToAgents[client.handshake.query.api]
        // this.server.to(client.id).emit('new-message-to-agents', { data });

        return;
    }

    @SubscribeMessage('pong')
    async pong(
        @MessageBody() data: number,
        @ConnectedSocket() client: Socket,
    ): Promise<number> {
        // this.server.emit('msg to client');
        console.log(data);

        return data;
    }

    afterInit(server: Server) {
        console.log('Init');
    }

    handleConnection(client: Socket, ...args: any[]) {
        console.log(`Client connected: ${client.id}`);

        // if client
        // check the token from client.handshake.query.token and get assigned room which is conversation_id
        // let roomName = room_name
        // this.client.join(roomName)

        //if agent
        // save to this.apiToAgents = client.id
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }
}
