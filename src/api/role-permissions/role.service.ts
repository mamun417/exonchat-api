import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Helper } from '../../helper/helper';

@Injectable()
export class RoleService {
    constructor(
        @InjectRepository(Role)
        private roleRepository: Repository<Role>,
    ) {}

    async findAll(): Promise<Role[]> {
        return await this.roleRepository.find({ relations: ['permissions'] });
    }

    async create(createRoleDto: CreateRoleDto) {
        createRoleDto.permissions = await this.makePermissionsArr(createRoleDto);
        return await this.roleRepository.save(createRoleDto);
    }

    async update(id: string, updateRoleDto: UpdateRoleDto) {
        const role = await this.findOne(id);

        role.permissions = await this.makePermissionsArr(updateRoleDto);

        return await this.roleRepository.save(role);
    }

    async findOne(id: string): Promise<Role> {
        return await new Helper().getSingleDataWithException(async () => {
            return await this.roleRepository.findOne(id, { relations: ['permissions'] });
        });
    }

    async remove(id: string): Promise<void> {
        await this.roleRepository.delete(id);
    }

    async makePermissionsArr(dto) {
        const permissions = [];

        for (const permissionId of dto.permissions) {
            permissions.push({ id: permissionId });
        }

        return permissions as Permission[];
    }
}
