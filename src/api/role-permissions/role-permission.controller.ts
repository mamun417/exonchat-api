import { Body, Controller, Get, Post } from '@nestjs/common';
import { RolePermissionService } from './role-permission.service';
import { CreateChatClientDto } from '../chat-clients/dto/create-chat-client.dto';
import { CreateRoleDto } from './dto/create-role.dto';

@Controller('roles')
export class RolePermissionController {
    constructor(private readonly rolePermissionService: RolePermissionService) {}

    // constructor(
    //     // private readonly roleService: RolePermissionService,
    //     // @InjectRepository(Role)
    //     // private roleRepository: Repository<Role>,
    //     private permissionRepository: Repository<Permission>,
    // ) {}

    @Post()
    async findAll(@Body() createRoleDto: CreateRoleDto) {
        return await this.rolePermissionService.create(createRoleDto);

        // const permission1 = new Permission();
        // permission1.name = 'animals';
        // permission1.slug = 'animals';
        // await this.permissionRepository.save(permission1);

        // const role = new Role();
        //
        // role.name = 'Tts name';
        // role.slug = 'test name';

        // role.permissions = [permission1];

        // const insertData = await this.roleRepository.save(role);

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

        // return insertData;
    }
}
