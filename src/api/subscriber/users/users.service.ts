import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { user } from '@prisma/client';
import { DataHelper } from 'src/helper/data-helper';
import { InviteUserDto } from './dto/invite-user.dto';
import { InvitationUpdateDto } from './dto/invitation-update.dto';
import { JoinUserDto } from './dto/join-user.dto';
import { UpdateUserActiveStateDto } from './dto/update-user-active-status.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService, private dataHelper: DataHelper) {}

    async validateForLogin(login_info: any, pass: string): Promise<user> {
        return this.prisma.user.findFirst({
            where: {
                email: login_info.email,
                subscriber: {
                    company_name: login_info.company_name,
                },
            },
            include: {
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
                // subscriber: {
                //     select: {
                //         id: true,
                //         company_name: true,
                //     },
                // },
            },
        });
    }

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
        });
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

                msg = 'Invitation was expired. resended.';
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
        });

        // send mail with invitationCreated.id

        return { msg: msg, status: 'success' };
    }

    async updateInvitation(id: any, req: any, invitationUpdateDto: InvitationUpdateDto) {
        const invitation: any = await this.findOneInvitationBySubscriberWithException(id, req);

        if (invitation.status === 'success') {
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

        throw new HttpException('Invitation was success. So cant delete', HttpStatus.UNPROCESSABLE_ENTITY);
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

        if (invitation.code !== joinUserDto.code) {
            throw new HttpException('Please check the mail for valid code', HttpStatus.UNPROCESSABLE_ENTITY);
        }

        const role = await this.prisma.role.findFirst({
            where: { slug: invitation.type === 'user' ? 'user' : 'agent', subscriber_id: null },
        });

        if (!role) {
            throw new HttpException('Something went wrong at assigning role', HttpStatus.NOT_IMPLEMENTED);
        }

        const user = this.prisma.user.create({
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

        return user;
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
        });
    }

    async findAll(req: any) {
        return this.prisma.user.findMany({
            where: {
                subscriber_id: req.user.data.subscriber_id,
            },
            include: {
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
                // subscriber: {
                //     select: {
                //         id: true,
                //         company_name: true,
                //     },
                // },
            },
        });
    }

    findActiveUsers(req: any) {
        return this.prisma.user.findMany({
            where: {
                active: true,
                subscriber_id: req.user.data.subscriber_id,
            },
            include: {
                socket_sessions: {
                    select: {
                        id: true,
                    },
                    orderBy: {
                        created_at: 'desc',
                    },
                    take: 5,
                },
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
        return this.prisma.user.findFirst({ where: { id: id, subscriber_id: req.user.data.subscriber_id } });
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
