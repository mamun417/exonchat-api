import { Injectable, Logger } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Helper } from '../../helper/helper';
import { AssignRoleToUserDto } from './dto/assign-role-to-user.dto';
import { ChatAgentsService } from '../chat-agents/chat-agents.service';
import { agent } from 'supertest';
import * as _ from 'lodash';

@Injectable()
export class RoleService {
    constructor() {}

    // async findAll(): Promise<Role[]> {
    //     return await this.roleRepository.find({ relations: ['permissions'] });
    // }

    // async create(createRoleDto: CreateRoleDto): Promise<Role> {
    //     createRoleDto.permissions = await this.makePermissionsArr(createRoleDto);
    //     return await this.roleRepository.save(createRoleDto);
    // }

    // async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    //     const role = await this.findOne(id);

    //     role.permissions = await this.makePermissionsArr(updateRoleDto);

    //     return await this.roleRepository.save(role);
    // }

    // async findOne(id: string): Promise<Role> {
    //     return await new Helper().getSingleDataWithException(async () => {
    //         return await this.roleRepository.findOne(id, { relations: ['permissions'] });
    //     }, 'roles');
    // }

    // async remove(id: string) {
    //     return await this.roleRepository.delete(id);
    // }

    // async roleAssignToUser(assignRoleToUserDto: AssignRoleToUserDto) {
    //     const userId = assignRoleToUserDto.user_id;
    //     const roleId = assignRoleToUserDto.role_id;
    //     let excludePermissions: any = assignRoleToUserDto.exclude_permissions;
    //     let includePermissions: any = assignRoleToUserDto.include_permissions;

    //     const role = await this.findOne(roleId); // validate role_id
    //     const chatAgent = await this.chatAgentsService.findOne(userId); // validate uer_id

    //     const rolePermissions = await this.chatAgentsService.getRolePermissions(userId);

    //     includePermissions = includePermissions.filter((permission) => {
    //         return _.findIndex(rolePermissions, ['id', permission]) === -1;
    //     });

    //     // remove which ids includes into includePermissions to get actual exclude permissions
    //     excludePermissions = excludePermissions.filter((permission) => {
    //         return !includePermissions.includes(permission) && _.findIndex(rolePermissions, ['id', permission]) !== -1;
    //     });

    //     // remove old data from userExtraPermissions
    //     await this.userExtraPermissionRepository.delete({
    //         user_id: userId,
    //     });

    //     // update userExtraPermissions
    //     await this.saveUserExtraPermissions(includePermissions, userId);
    //     await this.saveUserExtraPermissions(excludePermissions, userId, false);

    //     chatAgent.role_id = role.id;

    //     return await this.chatAgentsService.update(chatAgent.id, chatAgent);
    // }

    // async makePermissionsArr(dto) {
    //     const permissions = [];

    //     for (const permissionId of dto.permissions) {
    //         permissions.push({ id: permissionId });
    //     }

    //     return permissions as Permission[];
    // }

    // async saveUserExtraPermissions(permissions: [], userId: string, include = true, userType = 'agent') {
    //     if (permissions) {
    //         for (const permission of permissions) {
    //             const checkPermission = await this.permissionRepository.findOne(permission);

    //             if (checkPermission) {
    //                 const userExtraPermission = new UserExtraPermission();

    //                 userExtraPermission.user_id = userId;
    //                 userExtraPermission.permission_id = permission;
    //                 userExtraPermission.include = include;
    //                 userExtraPermission.user_type = userType;

    //                 await this.userExtraPermissionRepository.save(userExtraPermission);
    //             }
    //         }
    //     }
    // }
}
