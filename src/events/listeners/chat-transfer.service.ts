import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ListenersHelperService } from './listeners-helper.service';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ChatTransferService {
    constructor(private listenerHelpers: ListenersHelperService, private prisma: PrismaService) {}

    async call(server: Server, client: Socket, socketRes: any, conversations: any, usersRoom: any, clientsRoom: any) {
        // const resContainer = {
        //     conv_id: 'string',
        //     action: ['string', ['send', 'accept', 'reject']],
        //     notify_to: ['session_id', 'action = send'],
        //     notify_to_info: 'if notify to then must. it holds user info not session info',
        //     agent_info: 'agent_socket_ses_obj notify from',
        //     notify_except: 'if_from_client[ses_ids for not send]',
        //     client_info: 'client_socket_ses_obj',
        //     notify_to_dep: ['department_name{not id}', 'priority last'],
        //     reason: 'transfer_reason',
        // };

        if (
            !(await this.listenerHelpers.sysHasConversationsWithRecheck(
                socketRes,
                conversations,
                usersRoom,
                clientsRoom,
                server,
                client,
            ))
        )
            return; // later return error

        if (socketRes.action === 'send') {
            const convObj = conversations[socketRes.conv_id];

            let transferredToAgents = [];

            // if notify to then transfer manually
            if (socketRes.notify_to) {
                if (convObj.room_ids.includes(socketRes.notify_to)) {
                    return this.listenerHelpers.sendError(
                        client,
                        'ec_chat_transfer',
                        'Agent is already connected with this chat',
                    );
                } else {
                    convObj.notify_again = true;
                    convObj.notify_to = socketRes.notify_to;

                    transferredToAgents.push(socketRes.notify_to);

                    // console.log('Rooms In Conversations => ', this.roomsInAConv);
                }
            } else {
                // notify_to_dep is string for now. later can be array. y? think yourself
                // now only supports to all online agents to that dep
                const to_chat_dep = socketRes.notify_to_dep || convObj.chat_department; // notify_to_dep? then from agent else can be from anywhere

                // take this department's agents, except the one chatting. for future except is array omit all joined
                // for now if agents are online, send to them only
                const agents = this.listenerHelpers
                    .usersRoomBySubscriberId(usersRoom, convObj.sub_id)
                    .filter((roomId: any) => {
                        return (
                            usersRoom[roomId].chat_departments?.includes(to_chat_dep) &&
                            (!socketRes.notify_except || !socketRes.notify_except.includes(roomId)) &&
                            !convObj.room_ids.includes(roomId) // to_chat_dep ? then from agent so omit joined agents
                        );
                    });

                if (!agents.length) {
                    return this.listenerHelpers.sendError(
                        client,
                        'ec_chat_transfer',
                        'Chat transfer not possible. Agents are not available for this department',
                    );
                }

                transferredToAgents = agents;
            }

            this.listenerHelpers.sendToSocketClient(client, 'ec_chat_transfer', {
                from: 'own',
                status: 'success',
            });

            for (const agentSesId of transferredToAgents) {
                const upsertData = await this.prisma.conversation_session.upsert({
                    where: {
                        conv_ses_identifier: {
                            socket_session_id: agentSesId,
                            conversation_id: convObj.conv_id,
                        },
                    },
                    create: {
                        socket_session: { connect: { id: agentSesId } },
                        conversation: { connect: { id: socketRes.conv_id } },
                        subscriber: { connect: { id: convObj.sub_id } },
                        type: 'chat_transfer',
                        info: {
                            transfer_from: socketRes.agent_info || socketRes.client_info,
                        },
                    },
                    update: {
                        joined_at: null,
                        // left_at: null, // test without updating it
                        updated_at: new Date(),
                        type: 'chat_transfer',
                    },
                    include: {
                        socket_session: {
                            include: {
                                user: { include: { user_meta: true } },
                            },
                        },
                    },
                });

                this.listenerHelpers.sendToSocketRoom(server, agentSesId, 'ec_chat_transfer', {
                    conv_id: socketRes.conv_id,
                    agent_info: socketRes.agent_info,
                    client_info: socketRes.client_info,
                    reason: socketRes.reason,
                    conv_ses_obj: upsertData,
                    from: socketRes.notify_to_dep ? 'agent' : 'client',
                });
            }
        }

        //for now notify_to will determine for whom this transfer is

        //
        // // leave joined agents
        // if (isTransferred) {
        //     if (this.roomsInAConv.hasOwnProperty(socketRes.conv_id)) {
        //         // clone before remove so that we have all rooms to inform
        //         const roomsInAConvCopy = _.cloneDeep(this.roomsInAConv);
        //
        //         _.remove(
        //             this.roomsInAConv[socketRes.conv_id].room_ids,
        //             (item: any) => !this.convClientRoom(socketRes).includes(item),
        //         );
        //
        //         const joinedAgents = roomsInAConvCopy[socketRes.conv_id].room_ids.filter(
        //             (roomId: any) => !this.normalClientsInARoom.hasOwnProperty(roomId),
        //         );
        //
        //         for (const room of joinedAgents) {
        //             let conv_ses_data = null;
        //
        //             try {
        //                 const convSesRes: any = await this.httpService
        //                     .post(
        //                         `http://localhost:3000/conversations/${socketRes.conv_id}/leave`,
        //                         { socket_session_id: room, do_log: false },
        //                         { headers: { Authorization: `Bearer ${client.handshake.query.token}` } },
        //                     )
        //                     .toPromise();
        //
        //                 conv_ses_data = convSesRes.data;
        //
        //                 this.sendToAllUsers(
        //                     socketRes,
        //                     false,
        //                     'ec_is_leaved_from_conversation',
        //                     {
        //                         data: { conv_ses_data },
        //                         status: 'success',
        //                     },
        //                     true,
        //                     roomsInAConvCopy[socketRes.conv_id],
        //                 );
        //             } catch (e) {
        //                 console.log(e);
        //             }
        //         }
        //
        //         if (socketRes.notify_to) {
        //             const makeMsg = `transfer_${socketRes.notify_to}_${socketRes.notify_to.user_meta.display_name}`;
        //
        //             const transferMsg = await this.prisma.message.create({
        //                 data: {
        //                     message_type: 'log',
        //                     msg: makeMsg,
        //                     conversation: { connect: { id: socketRes.conv_id } },
        //                     subscriber: { connect: { id: convObj.sub_id } },
        //                     socket_session: { connect: { id: socketRes.ses_user.socket_session.id } },
        //                 },
        //                 include: {
        //                     conversation: {
        //                         include: {
        //                             conversation_sessions: {
        //                                 include: {
        //                                     socket_session: { include: { user: { include: { user_meta: true } } } },
        //                                 },
        //                             },
        //                             chat_department: true,
        //                         },
        //                     },
        //                 },
        //             });
        //
        //             this.sendToSocketRooms(
        //                 this.usersRoomBySubscriberId(convObj.sub_id, false),
        //                 'ec_msg_from_user',
        //                 transferMsg,
        //             );
        //
        //             this.sendToSocketRoom(this.clientRoomFromConv(convObj), 'ec_msg_to_client', transferMsg);
        //         }
        //     }
        // }
        //
        // this.sendToSocketClient(client, 'ec_chat_transfer_res', {
        //     conv_id: socketRes.conv_id,
        //     data: socketRes,
        // });
    }
}
