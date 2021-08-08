import { ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
    async canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const requestBody = request.body;

        let parsedLoginInfo: any = {};

        try {
            parsedLoginInfo = JSON.parse(requestBody.login_info);
        } catch (e) {
            throw new HttpException(`Invalid login credential fields`, HttpStatus.UNPROCESSABLE_ENTITY);
        }

        if (
            !parsedLoginInfo.hasOwnProperty('company_name') ||
            !parsedLoginInfo.hasOwnProperty('email') ||
            !requestBody.hasOwnProperty('pass')
        ) {
            throw new HttpException(`Invalid login credential fields`, HttpStatus.UNPROCESSABLE_ENTITY);
        }

        if (parsedLoginInfo.company_name === '' || parsedLoginInfo.email === '' || requestBody.pass === '') {
            throw new HttpException(`Login credential fields can not be empty`, HttpStatus.UNPROCESSABLE_ENTITY);
        }

        return (await super.canActivate(context)) as boolean;
    }
}
