import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { chat_agent } from '@prisma/client';

@Injectable()
export class ChatAgentsService {
    constructor(private prisma: PrismaService) {}

    async validateForLogin(login_info: any, pass: string): Promise<chat_agent> {
        return this.prisma.chat_agent.findFirst({
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
            },
        });
    }

    // create(createChatAgentDto: CreateChatAgentDto) {
    //     return 'This action adds a new chatAgent';
    // }

    // findAll() {
    //     return `This action returns all chatAgents`;
    // }

    // async findOne(id: string): Promise<ChatAgent> {
    //     return await new Helper().getSingleDataWithException(async () => {
    //         return await this.chatAgentRepository.findOne(id);
    //     }, 'chat_agents');
    // }

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
