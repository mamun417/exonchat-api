import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as moment from 'moment';
import * as _ from 'lodash';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ListenersHelperService {
    constructor(private httpService: HttpService, private prisma: PrismaService) {}

    // it's only for support if system restart happens
    // OR all connected conv relation are cleaned when user|client closed from this conv
    async sysHasConversationsWithRecheck(
        socketRes: any,
        conversations: any,
        usersRoom: any,
        clientsRoom: any,
        server: any,
        client: any,
    ) {
        if (!socketRes.hasOwnProperty('conv_id') || !socketRes.conv_id) return false; // later show error
        if (conversations.hasOwnProperty(socketRes.conv_id)) return true;

        const convId = socketRes.conv_id;

        try {
            const convRes: any = await this.httpService
                .get(`http://localhost:3000/conversations/${convId}/sessions`, {
                    headers: { Authorization: `Bearer ${client.handshake.query.token}` },
                })
                .toPromise();

            if (!convRes.data) {
                return this.sendError(client, 'ec_recheck_conv', 'conversation not found');
            } else if (convRes.data.closed_at) {
                return this.sendError(client, 'ec_recheck_conv', 'conversation is closed');
            } else {
                if (!conversations.hasOwnProperty(convId)) {
                    conversations[convId] = {
                        room_ids: _.map(convRes.data.conversation_sessions, 'socket_session_id'),
                    };

                    const conversation = conversations[convId];

                    conversation.conv_id = convId;

                    conversation.users_only = convRes.data.users_only;
                    conversation.chat_type = convRes.data.type;
                    conversation.created_at = convRes.data.created_at;

                    conversation.ai_is_replying = convRes.data.ai_is_replying;
                    conversation.routing_policy = convRes.data.routing_policy || 'manual';
                    conversation.sub_id = convRes.data.subscriber_id;
                    conversation.chat_department = convRes.data.chat_department.tag;

                    if (convRes.data.other_info) {
                        conversation.notify_to = convRes.data.other_info?.notify_to || null;
                    }

                    conversation.last_msg_time_client = 0;
                    conversation.last_msg_time_agent = null;

                    const lastClientMsg = await this.prisma.message.findFirst({
                        where: {
                            message_type: { not: 'log' },
                            conversation_id: convId,
                            socket_session: { user_id: null },
                        },
                        orderBy: { created_at: 'desc' },
                    });

                    if (lastClientMsg) {
                        conversation.last_msg_time_client = new Date(lastClientMsg.created_at).getTime();
                    }

                    // for now we are checking agents were joined
                    if (convRes.data.conversation_sessions.length > 1) {
                        const lastAgentMsg = await this.prisma.message.findFirst({
                            where: {
                                message_type: { not: 'log' },
                                conversation_id: convId,
                                socket_session: { user_id: { not: null } },
                            },
                            orderBy: { created_at: 'desc' },
                        });

                        if (lastAgentMsg) {
                            conversation.last_msg_time_agent = new Date(lastAgentMsg.created_at).getTime();
                        } else {
                            conversation.last_msg_time_agent = 0;
                        }

                        const firstJoin = _.sortBy(
                            convRes.data.conversation_sessions.filter((convSes: any) => convSes.socket_session.user_id),
                            [(convSes) => moment(convSes.created_at).format('x')],
                        );

                        if (new Date(firstJoin.created_at).getTime() > conversation.last_msg_time_client) {
                            conversation.last_msg_time_client = new Date(firstJoin.created_at).getTime();
                        }

                        const chatInactiveLog = await this.prisma.message.findFirst({
                            where: {
                                msg: 'chat_inactive',
                                message_type: 'log',
                                conversation_id: convId,
                            },
                            orderBy: { created_at: 'desc' },
                        });

                        conversation.chat_inactive_log_handled =
                            chatInactiveLog &&
                            new Date(chatInactiveLog.created_at).getTime() > conversation.last_msg_time_client;
                    }

                    conversation.timing_actions_interval = setInterval(
                        () => this.convTimingActionsInterval(server, conversations, usersRoom, clientsRoom, convId),
                        10000,
                    );
                }

                return true;
            }
        } catch (e) {
            this.sendError(client, 'ec_recheck_conv', e.response.data);
        }

        return false;
    }

    async convTimingActionsInterval(server, conversations: any, usersRoom: any, clientsRoom: any, convId: any) {
        const convObj = conversations[convId];

        if (!convObj) return;

        // property chat_inactive_log_handled will only insert if join. & if not log handled store it
        if (convObj.hasOwnProperty('chat_inactive_log_handled') && !convObj.chat_inactive_log_handled) {
            if (new Date().getTime() > convObj.last_msg_time_client + 10 * 60 * 1000) {
                const createdLog = await this.prisma.message.create({
                    data: {
                        msg: 'chat_inactive',
                        message_type: 'log',
                        conversation: { connect: { id: convId } },
                        subscriber: { connect: { id: convObj.sub_id } },
                    },
                    include: {
                        conversation: {
                            include: {
                                conversation_sessions: {
                                    include: {
                                        socket_session: { include: { user: { include: { user_meta: true } } } },
                                    },
                                },
                                chat_department: true,
                            },
                        },
                    },
                });

                this.sendToSocketRooms(
                    server,
                    this.usersRoomBySubscriberId(usersRoom, convObj.sub_id),
                    'ec_msg_from_client',
                    createdLog,
                );

                this.sendToSocketRoom(
                    server,
                    this.clientRoomFromConv(clientsRoom, convObj),
                    'ec_msg_to_client',
                    createdLog,
                );

                convObj.chat_inactive_log_handled = true;

                // console.log('chat inactive stored');
            }
        }
    }

    // only room ids
    usersRoomBySubscriberId(usersRoom: any, subscriberId: any) {
        return Object.keys(usersRoom).filter((roomId: any) => usersRoom[roomId].sub_id === subscriberId);
    }

    clientRoomFromConv(clientsRoom: any, conv: any) {
        return conv.room_ids.filter((room: any) => clientsRoom[room]?.sub_id === conv.sub_id);
    }

    sendToSocketRoom(server, roomId: string, emitName: string, emitObj: any) {
        server.in(roomId).emit(emitName, emitObj);
    }

    sendToSocketClient(client: any, emitName: any, emitObj: any) {
        client.emit(emitName, emitObj);
    }

    sendToSocketRooms(server: any, roomsId: any, emitName: string, emitObj: any) {
        roomsId.forEach((roomId: any) => {
            this.sendToSocketRoom(server, roomId, emitName, emitObj);
        });
    }

    sendError(client: any, step: string, msg: string | any = 'you are doing something wrong', extra = {}) {
        client.emit('ec_error', {
            type: 'warning',
            step: step,
            reason: msg,
            ...extra,
        });

        return false;
    }
}
