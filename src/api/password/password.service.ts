import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { EmailPasswordDto } from './dto/email-password.dto';
import { MailService } from '../../mail/mail.service';
import { Helper } from '../../helper/helper';
import * as moment from 'moment';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class PasswordService {
    constructor(private prisma: PrismaService, private mailService: MailService, private helper: Helper) {}

    async email(req: any, emailPasswordDto: EmailPasswordDto) {
        const findUser = await this.prisma.user.findFirst({
            where: { email: emailPasswordDto.email },
        });

        if (!findUser) throw new HttpException(`We can't find a user with that e-mail address`, HttpStatus.NOT_FOUND);

        const token: any = await this.helper.getToken();

        await this.prisma.user.update({
            where: { id: findUser.id },
            data: {
                forgot_password_token: token,
                forgot_password_token_expired: moment(
                    Date.now() + eval(process.env.RESET_PASS_TOKEN_EXPIRE_TIME),
                ).format(),
            },
        });

        try {
            await this.mailService.forgotPassword(emailPasswordDto.email, token);
        } catch (e: any) {
            console.log(e);
        }

        return { msg: 'Password reset notification send', status: 'success', token };
    }

    async reset(req: any, resetPasswordDto: ResetPasswordDto) {
        const findUser = await this.prisma.user.findFirst({
            where: { email: resetPasswordDto.email },
        });

        if (!findUser) throw new HttpException(`We can't find a user with that e-mail address`, HttpStatus.NOT_FOUND);

        if (findUser.forgot_password_token !== resetPasswordDto.token) {
            throw new HttpException('Token is invalid', HttpStatus.NOT_FOUND);
        }

        if (Date.now() > Number(findUser.forgot_password_token_expired)) {
            throw new HttpException('your token has been expired', HttpStatus.NOT_FOUND);
        }

        return await this.prisma.user.update({
            where: { id: findUser.id },
            data: {
                password: resetPasswordDto.password,
                forgot_password_token: null,
                forgot_password_token_expired: null,
            },
        });
    }
}
