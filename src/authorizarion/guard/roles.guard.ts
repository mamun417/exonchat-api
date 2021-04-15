import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../role.enum';
import { ROLES_KEY } from '../roles.decorator';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();
        const userRole = user.data?.role;

        if (userRole) {
            return requiredRoles.some((role) => role === userRole.slug);
        }
        return false;
        // return user;
        // return requiredRoles.some((role) => user.roles?.includes(role));
    }
}
