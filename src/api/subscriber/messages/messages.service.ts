import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DataHelper } from 'src/helper/data-helper';
import { PrismaService } from 'src/prisma.service';
import { AttachmentsService } from '../attachments/attachments.service';
import { ConversationsService } from '../conversations/conversations.service';

import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
    constructor(
        private prisma: PrismaService,
        private dataHelper: DataHelper,
        private conversationService: ConversationsService,
        private attachmentService: AttachmentsService,
    ) {}

    async create(req: any, createMessageDto: CreateMessageDto) {
        const subscriberId = req.user.data.socket_session.subscriber_id;
        const socketSessionId = req.user.data.socket_session.id;

        const conversation = await this.conversationService.findOneWithException(
            createMessageDto.conv_id,
            {
                subscriber_id: subscriberId,
                conversation_sessions: {
                    some: {
                        socket_session_id: socketSessionId,
                    },
                },
            },
            {},
            'conversation with other resource does not match',
        );

        if (conversation.closed_at) throw new HttpException('conversation is closed', HttpStatus.NOT_ACCEPTABLE);

        let attachmentsConnector: any = {};

        if (createMessageDto.attachments && createMessageDto.attachments.length) {
            attachmentsConnector = { attachments: { connect: [] } };
            for (const attcId of createMessageDto.attachments) {
                await this.attachmentService.findOneAttachmentWithException(attcId, req);

                attachmentsConnector.attachments.connect.push({ id: attcId });
            }
        }

        // save msg to speech also by checking auto_save_new_msg_to_speech

        await this.prisma.speech_recognition.upsert({
            where: {
                speech_subscriber_delete: {
                    speech: createMessageDto.msg,
                    tsid: subscriberId,
                    for_delete: false,
                },
            },
            create: { speech: createMessageDto.msg, tsid: subscriberId },
            update: {},
        });

        return this.prisma.message.create({
            data: {
                msg: createMessageDto.msg,
                subscriber: { connect: { id: subscriberId } },
                conversation: { connect: { id: conversation.id } },
                socket_session: { connect: { id: socketSessionId } },
                ...attachmentsConnector,
            },
            include: {
                attachments: true,
                conversation: {
                    include: {
                        conversation_sessions: { include: { socket_session: { include: { user: true } } } },
                        chat_department: true,
                        closed_by: { include: { user: true } },
                    },
                },
            },
        });
    }
}
