import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { EmailPasswordDto } from './dto/email-password.dto';
import { MailService } from '../../mail/mail.service';
import { Helper } from '../../helper/helper';
import * as moment from 'moment';

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
                forgot_password_token_expired: moment(Date.now() + 60 * 60 * 1000).format(),
            },
        });

        try {
            await this.mailService.forgotPassword(emailPasswordDto.email, token);
        } catch (e: any) {
            console.log(e);
        }

        return { msg: 'Password reset notification send', status: 'success', token };
    }
}
