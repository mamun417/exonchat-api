import { DataHelper } from './../../helper/data-helper';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateAvaterAttachmentDto } from './dto/update-avater-attachment.dto';

@Injectable()
export class ProfileService {
    constructor(private prisma: PrismaService, private dataHelper: DataHelper) {}

    async update(req: any, updateProfileDto: UpdateProfileDto) {
        return this.prisma.user.update({
            where: {
                id: req.user.data.id,
            },
            data: {
                user_meta: {
                    update: {
                        full_name: updateProfileDto.full_name,
                        display_name: updateProfileDto.display_name,
                        phone: updateProfileDto.phone,
                        address: updateProfileDto.address,
                    },
                },
            },
            include: {
                user_meta: {
                    include: {
                        attachment: true,
                    },
                },
            },
        });
    }

    async updateAvater(req: any, updateAvaterAttachment: UpdateAvaterAttachmentDto) {
        return this.prisma.user_meta.update({
            where: { id: req.user.data.user_meta.id },
            data: {
                attachment: { connect: { id: updateAvaterAttachment.attachment_id } },
            },
            include: {
                attachment: true,
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

    async findOneAttachmentWithException(id: string, req: any) {
        return await this.dataHelper.getSingleDataWithException(
            async () => await this.findOneAttachment(id, req),
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
}
