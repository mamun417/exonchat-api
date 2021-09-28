import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ListenersHelperService } from './listeners-helper.service';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class SocketRoomInfoService {
    constructor(private listenerHelpers: ListenersHelperService, private prisma: PrismaService) {}

    async update(server: Server, client: Socket, socketRes: any, conversations: any, usersRoom: any, clientsRoom: any) {
        // const roomName = socketRes.ses_user.socket_session.id;
        //
        // const dataSendObj: any = {};
        //
        // // body = {
        // //      online_status = ['online', 'offline', 'invisible'], for user
        // //      chat_status = ['active', 'inactive'] for client
        // //      status_for = client/user
        // // }
        //
        // if (
        //     socketRes.status_for !== 'client' &&
        //     socketRes.online_status &&
        //     ['online', 'offline', 'invisible'].includes(socketRes.online_status)
        // ) {
        //     usersRoom[roomName].online_status = socketRes.online_status;
        //
        //     dataSendObj.online_status = socketRes.online_status;
        // }
        //
        // if (
        //     socketRes.status_for === 'client' &&
        //     socketRes.chat_status &&
        //     ['active', 'inactive'].includes(socketRes.chat_status)
        // ) {
        //     clientsRoom[roomName].chat_status = socketRes.chat_status;
        //
        //     // if emit needed then make dataSendObj
        // }
        //
        // if (dataSendObj.online_status) {
        //     if (socketRes.status_for === 'user') {
        //         this.sendUsersOnlineStatus(socketRes.ses_user.socket_session.subscriber_id);
        //     } else {
        //         // no need to send to client for now
        //     }
        // } else {
        //     // send error
        // }
        //
        // return;
    }

    sendUsersOnlineStatus(subscriberId: any) {
        // const usersRoom = this.usersRoomBySubscriberId(subscriberId, false);
        // const dataObj: any = {};
        //
        // usersRoom.forEach((roomId: string) => {
        //     dataObj[roomId] = {
        //         session_id: roomId,
        //         online_status: this.userClientsInARoom[roomId]?.online_status,
        //     };
        // });
        //
        // this.sendToSocketRooms(usersRoom, 'ec_socket_rooms_info_res', {
        //     action: 'online_status',
        //     type: 'user',
        //     data: dataObj,
        // });
    }
}
