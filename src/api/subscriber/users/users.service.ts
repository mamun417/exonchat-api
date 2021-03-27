import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { user } from '@prisma/client';
import { Helper } from 'src/helper/helper';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

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

    findAll(req: any): Promise<user[]> {
        console.log(req.user.data.subscriber_id);

        return this.prisma.user.findMany({
            where: {
                subscriber_id: {
                    equals: req.user.data.subscriber_id,
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

    async findOne(id: string): Promise<user> {
        return this.prisma.user.findFirst({ where: { id: id } });
    }

    async findOneWithException(id: string): Promise<user> {
        return await new Helper().getSingleDataWithException(async () => this.findOne(id), 'user');
    }

    // async update(id: string, updateChatAgentDto: UpdateChatAgentDto): Promise<ChatAgent> {
    //     const chatAgent = await this.findOne(id);

    //     chatAgent.role_id = updateChatAgentDto.role_id;
    //     chatAgent.subscriber_id = updateChatAgentDto.subscriber_id;
    //     chatAgent.email = updateChatAgentDto.email;
    //     chatAgent.password = updateChatAgentDto.password;
    //     chatAgent.active = updateChatAgentDto.active;

    //     return await this.chatAgentRepository.save(chatAgent);
    // }

    // remove(id: number) {
    //     return `This action removes a #${id} chatAgent`;
    // }

    // async getRolePermissions(id: string) {
    //     return await new Helper().getSingleDataWithException(async () => {
    //         const chatAgent = await this.chatAgentRepository.findOne(id, {
    //             relations: ['role', 'role.permissions'],
    //         });

    //         return chatAgent.role.permissions;
    //     }, 'chat_agents');
    // }

    // async getUserPermissions(id: string) {
    //     const rolePermissions = await this.getRolePermissions(id);

    //     const rolePermissionIds = rolePermissions.map((permission) => permission.id);

    //     const userExtraPermissions = await this.userExtraPermissionRepository.find({
    //         user_id: id,
    //         include: true,
    //     });

    //     const userExtraPermissionsIds = userExtraPermissions.map((permission) => permission.permission_id);

    //     const allPermissionIds = _.union(rolePermissionIds, userExtraPermissionsIds);

    //     return await this.permissionRepository.find(allPermissionIds);
    // }
}
