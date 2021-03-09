import { Controller, Get } from '@nestjs/common';
import { RolePermissionService } from './role-permission.service';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller('role-test')
export class RolePermissionController {
    constructor(
        private readonly roleService: RolePermissionService,
        @InjectRepository(Role)
        private roleRepository: Repository<Role>, // private permissionRepository: Repository<Permission>,
    ) {}

    @Get()
    async findAll() {
        const permission1 = new Permission();
        permission1.name = 'animals';
        permission1.slug = 'animals';
        // await this.permissionRepository.save(permission1);

        const role = new Role();

        role.name = 'Tts name';
        role.slug = 'test name';

        role.permissions = [permission1];

        const insertData = await this.roleRepository.save(role);

        // const permission1 = new Permission();
        // permission1.name = 'animals';
        // permission1.slug = 'animals';
        //
        // const permission2 = new Permission();
        // permission2.name = 'zoo';
        // permission2.slug = 'zoo';
        //
        // const role = new Role();
        // role.permissions = [permission1, permission2];
        // await this.roleRepository.save(role);

        return insertData;
    }
}
