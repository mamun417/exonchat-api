import { Injectable } from '@nestjs/common';
import { UpdateChatAgentDto } from './dto/update-chat-agent.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RolePermissionService {
    constructor(
        @InjectRepository(Permission)
        private permissionRepository: Repository<Permission>,
        @InjectRepository(Role)
        private roleRepository: Repository<Role>,
    ) {}

    async create(createRoleDto: CreateRoleDto) {
        return createRoleDto;

        // const role = new Role();
        // role.name = 'gdfgfd';
        // role.slug = 'gfd';
        // role.permissions = [{ id: '30b5f2aa-8da2-42cf-a2e4-840b97f7e4fe' } as Permission];
        // return await this.roleRepository.save(role);

        // return await this.permissionRepository.save(permission1);
    }

    findAll() {
        return `This action returns all chatAgents`;
    }

    findOne(id: number) {
        return `This action returns a #${id} chatAgent`;
    }

    update(id: number, updateChatAgentDto: UpdateChatAgentDto) {
        return `This action updates a #${id} chatAgent`;
    }

    remove(id: number) {
        return `This action removes a #${id} chatAgent`;
    }
}
