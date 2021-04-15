import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { Role } from './role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from './guard/roles.guard';

export const ROLES_KEY = 'roles';
export const RequireRole = (...roles: Role[]) => {
    return applyDecorators(SetMetadata(ROLES_KEY, roles), UseGuards(JwtAuthGuard, RolesGuard));
    // return SetMetadata(ROLES_KEY, roles);
};
