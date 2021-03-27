import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { Permission } from './permission.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from './guard/permission.guard';

export const PERMISSION_KEY = 'permissions';
export const RequirePermission = (...permissions: Permission[]) => {
    return applyDecorators(SetMetadata(PERMISSION_KEY, permissions), UseGuards(JwtAuthGuard, PermissionGuard));
};
