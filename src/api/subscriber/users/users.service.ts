import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { user } from '@prisma/client';
import { DataHelper } from 'src/helper/data-helper';
import { InviteUserDto } from './dto/invite-user.dto';
import { InvitationUpdateDto } from './dto/invitation-update.dto';
import { JoinUserDto } from './dto/join-user.dto';
import { UpdateUserActiveStateDto } from './dto/update-user-active-status.dto';
import { MailService } from 'src/mail/mail.service';
import { ConvertUserTypeDto } from './dto/convert-user-type.dto';
import { EventsGateway } from 'src/events/events.gateway';

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private dataHelper: DataHelper,
        private mailService: MailService,
        private ws: EventsGateway,
    ) {}

    // async validateForLogin(login_info: any, pass: string): Promise<user> {
    //     return this.prisma.user.findFirst({
    //         where: {
    //             email: login_info.email,
    //             subscriber: {
    //                 company_name: login_info.company_name,
    //             },
    //         },
    //         include: {
    //             user_meta: {
    //                 include: {
    //                     attachment: true,
    //                 },
    //             },
    //             role: {
    //                 select: {
    //                     id: true,
    //                     slug: true,
    //                     permissions: {
    //                         select: {
    //                             id: true,
    //                             slug: true,
    //                         },
    //                     },
    //                 },
    //             },
    //             subscriber: {
    //                 select: {
    //                     id: true,
    //                     company_name: true,
    //                     display_name: true,
    //                     api_key: true,
    //                 },
    //             },
    //             chat_departments: true,
    //         },
    //     });
    // }

    // create(createChatAgentDto: CreateChatAgentDto) {
    //     return 'This action adds a new chatAgent';
    // }

    async updateUserActiveState(id: any, req: any, updateDto: UpdateUserActiveStateDto) {
        await this.findOneWithException(id, req);

        return this.prisma.user.update({
            where: {
                id: id,
            },
            data: {
                active: updateDto.active,
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

    async convertUserType(id: any, req: any, convertUserTypeDto: ConvertUserTypeDto) {
        const user: any = await this.findOneWithException(id, req);

        if (user.role.slug === convertUserTypeDto.convert_to) {
            throw new HttpException('You are already converted', HttpStatus.CONFLICT);
        }

        const role = await this.prisma.role.findFirst({
            where: { slug: convertUserTypeDto.convert_to, subscriber_id: null },
        });

        if (!role) {
            throw new HttpException('Something went wrong at assigning role', HttpStatus.NOT_IMPLEMENTED);
        }

        const updated = await this.prisma.user.update({
            where: { id: id },
            data: {
                role: { connect: { id: role.id } },
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

        this.ws.server.in(updated.socket_sessions[0].id).emit('ec_from_api_events', {
            action: 'logout',
            msg: 'Your role has changed by admin. You will be logged out now for the changes to take effect',
            reason: 'user type has changed',
        });

        return updated;
    }

    async invite(req: any, inviteUserDto: InviteUserDto) {
        const subscriberId = req.user.data.subscriber_id;

        const invitation: any = await this.prisma.user_invitation.findFirst({
            where: { email: inviteUserDto.email, subscriber_id: subscriberId },
        });

        let msg = 'Invitation send success';

        if (invitation) {
            if (invitation.status === 'success') {
                throw new HttpException('User already active', HttpStatus.CONFLICT);
            }

            if (invitation.status === 'pending') {
                throw new HttpException('Invitation already sent to this user', HttpStatus.CONFLICT);
            }

            if (invitation.status === 'expired') {
                await this.prisma.user_invitation.delete({
                    where: {
                        id: invitation.id,
                    },
                });

                msg = 'Invitation was expired. resend done.';
            }
        }

        const invitationCreated = await this.prisma.user_invitation.create({
            data: {
                email: inviteUserDto.email,
                code: '1234',
                subscriber: { connect: { id: subscriberId } },
                type: inviteUserDto.type,
                active: inviteUserDto.active,
            },
            include: {
                subscriber: true,
            },
        });

        // send mail with invitationCreated.id
        try {
            await this.mailService.sendUserInvitation(inviteUserDto.email, invitationCreated);
        } catch (e: any) {
            console.log(e);
        }

        return { msg: msg, status: 'success' };
    }

    async updateInvitation(id: any, req: any, invitationUpdateDto: InvitationUpdateDto) {
        const invitation: any = await this.findOneInvitationBySubscriberWithException(id, req);

        if (invitation.status === 'pending') {
            return this.prisma.user_invitation.update({
                where: {
                    id: id,
                },
                data: {
                    type: invitationUpdateDto.type,
                    active: invitationUpdateDto.active,
                },
            });
        }

        throw new HttpException('Convert user allow only for pending invitation.', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    async deleteInvitation(id: any, req: any) {
        const invitation: any = await this.findOneInvitationBySubscriberWithException(id, req);

        if (invitation.status !== 'success') {
            return this.prisma.user_invitation.delete({
                where: {
                    id: id,
                },
            });
        }

        throw new HttpException('Invitation was success. So cant delete', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    async join(joinUserDto: JoinUserDto) {
        const invitation: any = await this.findOneInvitationWithException(joinUserDto.invitation_id);

        if (invitation.status !== 'pending') {
            throw new HttpException('Invitation not found', HttpStatus.NOT_FOUND);
        }

        console.log(invitation, joinUserDto.code);

        if (invitation.code !== joinUserDto.code) {
            throw new HttpException('Please check the mail for valid code', HttpStatus.UNPROCESSABLE_ENTITY);
        }

        const role = await this.prisma.role.findFirst({
            where: { slug: invitation.type === 'user' ? 'user' : 'agent', subscriber_id: null },
        });

        if (!role) {
            throw new HttpException('Something went wrong at assigning role', HttpStatus.NOT_IMPLEMENTED);
        }

        const user: any = await this.prisma.user.create({
            data: {
                email: invitation.email,
                password: joinUserDto.password,
                active: invitation.active,
                subscriber: { connect: { id: invitation.subscriber_id } },
                role: { connect: { id: role.id } },
                user_meta: {
                    create: {
                        full_name: joinUserDto.full_name,
                        display_name: joinUserDto.display_name,
                    },
                },
                socket_sessions: {
                    create: {
                        ip: 'user',
                        subscriber: { connect: { id: invitation.subscriber_id } },
                    },
                },
            },
        });

        await this.prisma.user_invitation.update({
            where: { id: invitation.id },
            data: {
                status: 'success',
            },
        });

        return { status: 'success', msg: 'Your account activated' };
    }

    async cancel(id: any, req: any) {
        const subscriberId = req.user.data.subscriber_id;

        const invitation: any = await this.findOneBySubscriberIdInvitationWithException(id, subscriberId);

        if (invitation.status === 'pending') {
            this.prisma.user_invitation.update({
                where: { id: invitation.id },
                data: {
                    status: 'cancelled',
                },
            });
        } else {
            throw new HttpException('Invitation already processed', HttpStatus.CONFLICT);
        }
    }

    async findAllInvitation(req: any) {
        return this.prisma.user_invitation.findMany({
            where: {
                subscriber_id: req.user.data.subscriber_id,
            },
            orderBy: {
                created_at: 'desc',
            },
        });
    }

    async findAll(req: any) {
        return this.prisma.user.findMany({
            where: {
                subscriber_id: req.user.data.subscriber_id,
            },
            select: {
                id: true,
                email: true,
                active: true,
                online_status: true,
                user_meta: {
                    include: { attachment: true },
                },
                socket_sessions: {
                    select: {
                        id: true,
                    },
                    orderBy: {
                        created_at: 'desc',
                    },
                },
                role: true,
            },
        });
    }

    async findAllInvitations(req: any) {
        return this.prisma.user_invitation.findMany({
            where: {
                subscriber_id: req.user.data.subscriber_id,
            },
        });
    }

    findActiveUsers(req: any) {
        return this.prisma.user.findMany({
            where: {
                active: true,
                subscriber_id: req.user.data.subscriber_id,
            },
            select: {
                id: true,
                email: true,
                active: true,
                online_status: true,
                user_meta: {
                    include: { attachment: true },
                },
                socket_sessions: {
                    select: {
                        id: true,
                    },
                    orderBy: {
                        created_at: 'desc',
                    },
                },
                role: true,
            },
        });
    }

    async findOneInvitation(id: string) {
        return this.prisma.user_invitation.findFirst({
            where: {
                id: id,
            },
        });
    }

    async findOneInvitationWithException(id: string): Promise<user> {
        return this.dataHelper.getSingleDataWithException(async () => this.findOneInvitation(id), 'user');
    }

    async findOneInvitationBySubscriber(id: string, req: any) {
        return this.prisma.user_invitation.findFirst({
            where: {
                id: id,
                subscriber_id: req.user.data.subscriber_id,
            },
        });
    }

    async findOneInvitationBySubscriberWithException(id: string, req: any): Promise<user> {
        return this.dataHelper.getSingleDataWithException(
            async () => this.findOneInvitationBySubscriber(id, req),
            'user',
        );
    }

    async findOne(id: string, req: any): Promise<user> {
        return this.prisma.user.findFirst({
            where: { id: id, subscriber_id: req.user.data.subscriber_id },
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

    async findOneWithException(id: string, req: any): Promise<user> {
        return this.dataHelper.getSingleDataWithException(async () => this.findOne(id, req), 'user');
    }

    async findOneByIdAndApi(id: string, api_key: string): Promise<user> {
        return this.prisma.user.findFirst({
            where: {
                id,
                subscriber: {
                    api_key,
                },
            },
        });
    }

    async findOneByIdAndApiWithException(id: string, api_key: string): Promise<user> {
        return this.dataHelper.getSingleDataWithException(async () => this.findOneByIdAndApi(id, api_key), 'user');
    }

    async findOneBySubscriberIdInvitation(id: string, subscriber_id: string) {
        return this.prisma.user_invitation.findFirst({
            where: {
                id: id,
                subscriber_id: subscriber_id,
            },
        });
    }

    async findOneBySubscriberIdInvitationWithException(id: string, subscriber_id: string) {
        return this.dataHelper.getSingleDataWithException(
            async () => this.findOneBySubscriberIdInvitation(id, subscriber_id),
            'invitation',
        );
    }
}
