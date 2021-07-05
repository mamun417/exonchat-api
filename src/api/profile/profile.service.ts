import { DataHelper } from '../../helper/data-helper';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateAvatarAttachmentDto } from './dto/update-avatar-attachment.dto';
import { AttachmentsService } from '../subscriber/attachments/attachments.service';
import { UpdateOnlineStatusDto } from './dto/update-online-status.dto';

@Injectable()
export class ProfileService {
    constructor(
        private prisma: PrismaService,
        private dataHelper: DataHelper,
        private attachmentService: AttachmentsService,
    ) {}

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
                        facebook: updateProfileDto.facebook,
                        twitter: updateProfileDto.twitter,
                        linkedin: updateProfileDto.linkedin,
                    },
                },
            },
            include: {
                user_meta: {
                    include: {
                        attachment: true,
                    },
                },
                role: {
                    select: {
                        id: true,
                        slug: true,
                        permissions: {
                            select: {
                                id: true,
                                slug: true,
                            },
                        },
                    },
                },
                subscriber: {
                    select: {
                        id: true,
                        company_name: true,
                        display_name: true,
                        api_key: true,
                    },
                },
                chat_departments: true,
            },
        });
    }

    async updateOnlineStatus(req: any, updateOnlineStatusDto: UpdateOnlineStatusDto) {
        return this.prisma.user.update({
            where: {
                id: req.user.data.id,
            },
            data: {
                online_status: updateOnlineStatusDto.online_status,
            },
            include: {
                user_meta: {
                    include: {
                        attachment: true,
                    },
                },
                role: {
                    select: {
                        id: true,
                        slug: true,
                        permissions: {
                            select: {
                                id: true,
                                slug: true,
                            },
                        },
                    },
                },
                subscriber: {
                    select: {
                        id: true,
                        company_name: true,
                        display_name: true,
                        api_key: true,
                    },
                },
                chat_departments: true,
            },
        });
    }

    async updateAvatar(req: any, updateAvatarAttachmentDto: UpdateAvatarAttachmentDto) {
        await this.attachmentService.findOneAttachmentWithException(updateAvatarAttachmentDto.attachment_id, req);
        // console.log(updateAvatarAttachmentDto.attachment_id);

        return this.prisma.user.update({
            where: { id: req.user.data.id },
            data: {
                user_meta: {
                    update: {
                        attachment: { connect: { id: updateAvatarAttachmentDto.attachment_id } },
                    },
                },
            },
            include: {
                user_meta: {
                    include: {
                        attachment: true,
                    },
                },
                role: {
                    select: {
                        id: true,
                        slug: true,
                        permissions: {
                            select: {
                                id: true,
                                slug: true,
                            },
                        },
                    },
                },
                subscriber: {
                    select: {
                        id: true,
                        company_name: true,
                        display_name: true,
                        api_key: true,
                    },
                },
                chat_departments: true,
                socket_sessions: true,
            },
        });
    }
}
