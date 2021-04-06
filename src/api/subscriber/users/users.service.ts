import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { user } from '@prisma/client';
import { DataHelper } from 'src/helper/data-helper';

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

    findAll(req: any) {
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
}
