import { HttpModule, Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PasswordController } from './password.controller';
import { PasswordService } from './password.service';
import { DataHelper } from '../../helper/data-helper';
import { Helper } from '../../helper/helper';
import { MailModule } from '../../mail/mail.module';

@Module({
    imports: [HttpModule, MailModule],
    controllers: [PasswordController],
    providers: [PrismaService, DataHelper, Helper, PasswordService],
})
export class PasswordModule {}
