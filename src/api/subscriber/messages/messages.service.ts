import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DataHelper } from 'src/helper/data-helper';
import { PrismaService } from 'src/prisma.service';
import { ConversationsService } from '../conversations/conversations.service';

import { CreateMessageDto } from './dto/create-message.dto';

import { unlinkSync } from 'fs';
import { join, extname } from 'path';

@Injectable()
export class MessagesService {
    constructor(
        private prisma: PrismaService,
        private dataHelper: DataHelper,
        private conversationService: ConversationsService,
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

        // save msg to speech

        return this.prisma.message.create({
            data: {
                msg: createMessageDto.msg,
                subscriber: { connect: { id: subscriberId } },
                conversation: { connect: { id: conversation.id } },
                socket_session: { connect: { id: socketSessionId } },
            },
        });
    }

    async attachmentUpdateStatus(id: any, req: any) {
        await this.findOneAttachmentWithException(id, req);

        return this.prisma.attachment.update({
            where: {
                id: id,
            },
            data: {
                uploaded: true,
            },
        });
    }

    async attachmentDelete(id: any, req: any) {
        const attachment: any = await this.findOneAttachmentWithException(id, req);

        const fileExtName = extname(attachment.original_name);
        const attachmentsPath = `${join(process.cwd(), 'uploads')}/attachments`;
        const fullPath = `${attachmentsPath}/${attachment.subscriber_id}/${attachment.socket_session_id}/${id}${fileExtName}`;

        try {
            unlinkSync(fullPath);
        } catch (e) {
            throw new HttpException('file remove error. please contact support', HttpStatus.NOT_FOUND);
        }

        return this.prisma.attachment.delete({
            where: {
                id: id,
            },
        });
    }

    async findOneAttachment(id: any, req: any) {
        const subscriberId = req.user.data.socket_session.subscriber_id;

        return this.prisma.attachment.findFirst({
            where: {
                id: id,
                subscriber_id: subscriberId,
            },
        });
    }

    async findOneAttachmentWithException(id: string, req: any) {
        return await this.dataHelper.getSingleDataWithException(
            async () => await this.findOneAttachment(id, req),
            'attachment',
        );
    }
}
