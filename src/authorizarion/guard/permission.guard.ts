import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '../permission.enum';
import { PERMISSION_KEY } from '../permission.decorator';

import * as _l from 'lodash';

@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSION_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredPermissions) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        const permissionsArray = user.data?.role?.permissions;

        if (permissionsArray.length) {
            // console.log(_l.map(permissionsArray, 'slug'));

            return requiredPermissions.some((permission) => _l.map(permissionsArray, 'slug').includes(permission));
        }
        return false;
    }
}
