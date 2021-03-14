import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Helper } from '../../helper/helper';
import { AssignRoleToUserDto } from './dto/assign-role-to-user.dto';
import { ChatAgent } from '../chat-agents/entities/chat-agent.entity';
import { ChatAgentsService } from '../chat-agents/chat-agents.service';
import { UserExtraPermission } from './entities/user_extra_permission.entity';

@Injectable()
export class RoleService {
    constructor(
        @InjectRepository(Role)
        private roleRepository: Repository<Role>,

        @InjectRepository(UserExtraPermission)
        private userExtraPermissionRepository: Repository<UserExtraPermission>,

        @InjectRepository(ChatAgent)
        private chatAgentRepository: Repository<ChatAgent>,

        private readonly chatAgentsService: ChatAgentsService,
    ) {}

    async findAll(): Promise<Role[]> {
        return await this.roleRepository.find({ relations: ['permissions'] });
    }

    async create(createRoleDto: CreateRoleDto): Promise<Role> {
        createRoleDto.permissions = await this.makePermissionsArr(createRoleDto);
        return await this.roleRepository.save(createRoleDto);
    }

    async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
        const role = await this.findOne(id);

        role.permissions = await this.makePermissionsArr(updateRoleDto);

        return await this.roleRepository.save(role);
    }

    async findOne(id: string): Promise<Role> {
        return await new Helper().getSingleDataWithException(async () => {
            return await this.roleRepository.findOne(id, { relations: ['permissions'] });
        }, 'roles');
    }

    async remove(id: string) {
        return await this.roleRepository.delete(id);
    }

    async roleAssignToUser(assignRoleToUserDto: AssignRoleToUserDto) {
        const userId = assignRoleToUserDto.user_id;
        const roleId = assignRoleToUserDto.role_id;
        const excludePermissions = assignRoleToUserDto.exclude_permissions;
        const includePermissions = assignRoleToUserDto.include_permissions;

        const role = await this.findOne(roleId); // validate role_id
        const chatAgent = await this.chatAgentsService.findOne(userId); // validate uer_id

        chatAgent.role_id = role.id;

        return await this.chatAgentsService.update(chatAgent.id, chatAgent);

        // save extra permissions

        // return response;
    }

    async makePermissionsArr(dto) {
        const permissions = [];

        for (const permissionId of dto.permissions) {
            permissions.push({ id: permissionId });
        }

        return permissions as Permission[];
    }
}
