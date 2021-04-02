import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { use } from 'passport';
import { AuthService } from '../auth.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
    constructor(private authService: AuthService) {}

    async canActivate(context: ExecutionContext) {
        const client = context.switchToWs().getClient();

        const token = client.handshake.query.token;

        const user = this.authService.verifyToken(token);

        if (user) {
            context.switchToWs().getData().ses_user = user.data;
            return true;
        }

        client.emit('ec_error', {
            type: 'auth',
            step: 'any',
            reason: 'invalid token. please provide a valid token',
        });

        return false;
    }
}
