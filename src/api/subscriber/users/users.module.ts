import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from 'src/prisma.service';
import { DataHelper } from 'src/helper/data-helper';
import { MailModule } from 'src/mail/mail.module';

@Module({
    imports: [MailModule],
    controllers: [UsersController],
    providers: [PrismaService, DataHelper, UsersService],
    exports: [UsersService],
})
export class UsersModule {}
