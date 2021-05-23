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
                '<div style="padding: 50px;max-width: 600px; font-size: 22px">\n' +
                '   <b>Hello!</b>\n' +
                '   <p>You are receiving this email because your have got an invitation from' +
                '   <b>' +
                invitation.subscriber.display_name +
                '   </b></p>\n' +
                '   <p>Click below link and use <b>' +
                invitation.code +
                '   </b> Code for activate your account</p>\n' +
                '   <b>' +
                url +
                +'  </b>\n' +
                '   Regards,<br>\n' +
                '   <b>ExonChat</b>' +
                '</div>',
        });
    }
}
