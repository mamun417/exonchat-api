import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DataHelper } from 'src/helper/data-helper';
import { PrismaService } from 'src/prisma.service';

import { unlinkSync } from 'fs';
import { join, extname } from 'path';

@Injectable()
export class AttachmentsService {
    constructor(private prisma: PrismaService, private dataHelper: DataHelper) {}

    async getAllAttachments(req: any) {
        const subscriberId = req.user.data.socket_session.subscriber_id;
        const socketSessionId = req.user.data.socket_session.id;

        return this.prisma.attachment.findMany({
            where: {
                subscriber_id: subscriberId,
                socket_session_id: socketSessionId,
                uploaded: true,
                user_has_control: true,
            },
            orderBy: { created_at: 'desc' },
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

    async revokeAttachmentControl(id: any, req: any) {
        await this.findOneAttachmentByOwnSesIdWithException(id, req);

        const removableAttachment = await this.prisma.attachment.findFirst({
            where: {
                id: id,
                messages: { none: {} },
            },
        });

        if (removableAttachment) {
            return this.prisma.attachment.delete({
                where: {
                    id: id,
                },
            });
        }

        return await this.prisma.attachment.update({
            where: {
                id: id,
            },
            data: {
                user_has_control: false,
            },
        });
    }

    async attachmentDelete(id: any, req: any) {
        const attachment: any = await this.findOneAttachmentByOwnSesIdWithException(id, req);

        const fileExtName = extname(attachment.original_name);
        const attachmentsPath = `${join(process.cwd(), 'uploads')}/attachments`;
        const fullPath = `${attachmentsPath}/${attachment.subscriber_id}/${attachment.folder_path}/${id}${fileExtName}`;

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

    async findOneAttachmentByOwnSesId(id: any, req: any) {
        const subscriberId = req.user.data.socket_session.subscriber_id;
        const socketSessionId = req.user.data.socket_session.id;

        return this.prisma.attachment.findFirst({
            where: {
                id: id,
                subscriber_id: subscriberId,
                socket_session_id: socketSessionId,
            },
        });
    }

    async findOneAttachmentByOwnSesIdWithException(id: string, req: any) {
        return await this.dataHelper.getSingleDataWithException(
            async () => await this.findOneAttachmentByOwnSesId(id, req),
            'attachment',
        );
    }

    async findOneAttachment(id: any, req: any) {
        if (!id) return null; // sometime id can be null

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
