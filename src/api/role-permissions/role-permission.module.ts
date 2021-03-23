import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { UsersService } from 'src/api/subscriber/users/users.service';

@Module({
    imports: [],
    controllers: [RoleController],
    providers: [RoleService, UsersService],
})
export class RolePermissionModule {}
