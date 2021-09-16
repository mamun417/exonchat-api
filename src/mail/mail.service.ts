import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
    constructor(private mailerService: MailerService) {}

    from = '"ExonHost LiveChat" <chat@exonhost.com>';
    regards = 'ExonHost LiveChat';

    async sendUserInvitation(emailTo: string, invitation: any) {
        const url = `${process.env.CLIENT_URL}/auth/user-activate/${invitation.id}`;

        await this.mailerService.sendMail({
            to: emailTo,
            from: this.from,
            subject: 'Welcome to Nice App! Confirm your Email',
            html:
                ' <div style="padding: 50px;max-width: 600px">\n' +
                '        <b>Hello!</b>\n' +
                '        <p>You are receiving this email because your have got an invitation from ' +
                invitation.subscriber.display_name +
                '.</p>\n' +
                '        <p>Click below link and use ' +
                '<b>' +
                invitation.code +
                '</b>' +
                ' Code for activate your account</p>\n' +
                '        <div style="text-align: center;margin-bottom: 30px;margin-top: 30px">\n' +
                '            <a style="padding: 12px;\n' +
                '                background: #000000;\n' +
                '                color: #fff;\n' +
                '                text-decoration: none;\n' +
                '                border-radius: 3px;\n' +
                '                border-color: #000000"\n' +
                '                href="' +
                url +
                '"\n' +
                '            >\n' +
                '                Activate Account\n' +
                '            </a>\n' +
                '        </div>\n' +
                '        <p>Thank you.</p>\n' +
                '        Regards,<br>\n' +
                '        ' +
                this.regards +
                '\n' +
                '    </div>',
        });
    }

    async forgotPassword(emailTo: string, token: any) {
        const url = `${process.env.CLIENT_URL}/auth/password/reset/${token}`;
        const expireTimeInMin = eval(process.env.RESET_PASS_TOKEN_EXPIRE_TIME) / 60000; // 60 min

        await this.mailerService.sendMail({
            to: emailTo,
            from: this.from,
            subject: 'Reset Password Notification',
            html:
                '<div style="padding: 50px;max-width: 600px">\n' +
                '        <b>Hello!</b>\n' +
                '        <p>You are receiving this email because we received a password reset request for your account.</p>\n' +
                '        <div style="text-align: center;margin-bottom: 30px;margin-top: 30px">\n' +
                '            <a style="padding: 12px;\n' +
                '                background: #000000;\n' +
                '                color: #fff;\n' +
                '                text-decoration: none;\n' +
                '                border-radius: 3px;\n' +
                '                border-color: #000000"\n' +
                '                href="' +
                url +
                '">\n' +
                '                Reset Password\n' +
                '            </a>\n' +
                '        </div>\n' +
                '        <p>This password reset link will expire in ' +
                expireTimeInMin +
                ' minutes.</p>\n' +
                '        <p>If you did not request a password reset, no further action is required.</p>\n' +
                '        Regards,<br>\n' +
                '        ' +
                this.regards +
                '\n' +
                '    </div>',
        });
    }

    async sendTranscript(emailTo: string, mailHtml: string, mailAttachments: any) {
        await this.mailerService.sendMail({
            to: emailTo,
            from: this.from,
            subject: 'Chat Transcript',
            html: mailHtml,
            attachments: mailAttachments,
        });
    }
}
