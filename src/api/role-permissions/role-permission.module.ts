import { Module } from '@nestjs/common';
import { RolePermissionService } from './role-permission.service';
import { RolePermissionController } from './role-permission.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Role, Permission])],
    controllers: [RolePermissionController],
    providers: [RolePermissionService],
})
export class RolePermissionModule {}
