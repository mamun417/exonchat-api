import { subscriber } from '@prisma/client';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
    constructor(private mailerService: MailerService) {}

    async sendUserInvitation(emailTo: string, invitation: any) {
        const url = `${process.env.CLIENT_URL}/auth/user-activate/${invitation.id}`;

        await this.mailerService.sendMail({
            to: emailTo,
            // from: '"Support Team" <support@example.com>', // override default from
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
                '        Exonchat\n' +
                '\n' +
                '    </div>',
        });
    }
}
