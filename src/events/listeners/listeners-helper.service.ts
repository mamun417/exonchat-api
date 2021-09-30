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
                this.sendError(client, 'ec_recheck_conv', 'conversation not found');
            } else if (convRes.data.closed_at) {
                this.sendError(client, 'ec_recheck_conv', 'conversation is closed');
            } else {
                await this.addConvDataToInstanceIfNot(convRes.data, conversations, server, usersRoom, clientsRoom);

                return true;
            }
        } catch (e) {
            this.sendError(client, 'ec_recheck_conv', e.response.data);
        }

        return false;
    }

    async addConvDataToInstanceIfNot(convObj: any, conversations: any, server: any, usersRoom: any, clientsRoom: any) {
        const convId = convObj.id;

        if (!conversations.hasOwnProperty(convId)) {
            conversations[convId] = {
                room_ids: _.map(
                    convObj.conversation_sessions.filter((convSes: any) => !convSes.left_at && convSes.joined_at),
                    'socket_session_id',
                ),
            };

            const conversation = conversations[convId];

            conversation.client_room_id = _.find(
                convObj.conversation_sessions,
                (conv_ses: any) => !conv_ses.socket_session.user,
            )?.socket_session_id;

            conversation.conv_id = convId;

            conversation.users_only = convObj.users_only;
            conversation.chat_type = convObj.type;
            conversation.created_at = convObj.created_at;

            conversation.ai_is_replying = convObj.ai_is_replying;
            conversation.routing_policy = convObj.routing_policy || 'manual';
            conversation.sub_id = convObj.subscriber_id;
            conversation.chat_department = convObj.chat_department?.tag;

            if (convObj.other_info) {
                conversation.notify_to = convObj.other_info?.notify_to || null;
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
            if (convObj.conversation_sessions.length > 1) {
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
                    convObj.conversation_sessions.filter((convSes: any) => convSes.socket_session.user_id),
                    [(convSes) => moment(convSes.created_at).format('x')],
                );

                if (new Date(firstJoin[0].created_at).getTime() > conversation.last_msg_time_client) {
                    conversation.last_msg_time_client = new Date(firstJoin[0].created_at).getTime();
                }

                // assign key only when if any joins happen.
                // true if has log & log is newer then client msg || agent msg
                const lastMsgTime =
                    conversation.last_msg_time_agent !== null &&
                    conversation.last_msg_time_agent > conversation.last_msg_time_client
                        ? conversation.last_msg_time_agent
                        : conversation.last_msg_time_client;

                const chatInactiveLog = await this.prisma.message.findFirst({
                    where: {
                        msg: 'chat_inactive',
                        message_type: 'log',
                        conversation_id: convId,
                    },
                    orderBy: { created_at: 'desc' },
                });

                conversation.chat_inactive_log_handled =
                    chatInactiveLog && new Date(chatInactiveLog.created_at).getTime() > lastMsgTime;
            }

            conversation.timing_actions_interval = setInterval(
                () => this.convTimingActionsInterval(server, conversations, usersRoom, clientsRoom, convId),
                10000,
            );
        }
    }

    async convTimingActionsInterval(server, conversations: any, usersRoom: any, clientsRoom: any, convId: any) {
        const convObj = conversations[convId];

        const intervalTime = 10 * 60 * 1000;

        const convCloseIntervalTime = 60 * 60 * 1000;

        const lastMsgTime =
            convObj.last_msg_time_agent !== null && convObj.last_msg_time_agent > convObj.last_msg_time_client
                ? convObj.last_msg_time_agent
                : convObj.last_msg_time_client;

        // property chat_inactive_log_handled will only insert if join. & if not log handled store it
        if (
            convObj.hasOwnProperty('chat_inactive_log_handled') &&
            !convObj.chat_inactive_log_handled &&
            !convObj.users_only
        ) {
            if (new Date().getTime() > lastMsgTime + intervalTime) {
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

                this.sendToSocketRoom(server, convObj.client_room_id, 'ec_msg_to_client', createdLog);

                convObj.chat_inactive_log_handled = true;
            }
        }

        // close conversation interval action. do this last. in join chat_inactive_log_handled check is making it safe
        if (
            !convObj.users_only &&
            new Date().getTime() > lastMsgTime + convCloseIntervalTime &&
            convObj.last_msg_time_agent !== null // that means agents were joined
        ) {
            console.log('conv close candidate', convId);

            const updateCount = await this.prisma.conversation.updateMany({
                where: {
                    id: convId,
                    users_only: false,
                    closed_at: null,
                    subscriber_id: convObj.sub_id,
                },
                data: {
                    closed_at: new Date(),
                    closed_reason: 'Chat is closed due to inactivity',
                },
            });

            if (updateCount.count === 1) {
                const conv_data: any = await this.prisma.conversation.findUnique({
                    where: { id: convId },
                    include: {
                        closed_by: {
                            include: {
                                user: { include: { user_meta: true } },
                            },
                        },
                        conversation_sessions: {
                            include: {
                                socket_session: {
                                    include: {
                                        user: { include: { user_meta: true } },
                                    },
                                },
                            },
                        },
                    },
                });

                conv_data.log_message = await this.prisma.message.create({
                    data: {
                        msg: 'closed',
                        message_type: 'log',
                        conversation: { connect: { id: convId } },
                        subscriber: { connect: { id: convObj.sub_id } },
                    },
                });

                // before clone remove interval check
                clearInterval(convObj.timing_actions_interval);

                // clone before remove so that we can inform client. it can be simplified
                const roomsInAConvCopy = _.cloneDeep(conversations);

                delete conversations[convId];

                this.sendToSocketRooms(
                    server,
                    this.usersRoomBySubscriberId(usersRoom, roomsInAConvCopy[convId].sub_id),
                    'ec_is_closed_from_conversation',
                    {
                        data: { conv_data, conv_id: convId },
                        status: 'success',
                    },
                );

                this.sendToSocketRoom(server, convObj.client_room_id, 'ec_is_closed_from_conversation', {
                    data: { conv_data, conv_id: convId },
                    status: 'success',
                });
            }
        }
    }

    // only room ids
    usersRoomBySubscriberId(usersRoom: any, subscriberId: any) {
        return Object.keys(usersRoom).filter((roomId: any) => usersRoom[roomId].sub_id === subscriberId);
    }

    clientRoomFromConv(clientsRoom: any, conv: any) {
        return conv.client_room_id;
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
