import { DataHelper } from '../../helper/data-helper';
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from 'src/prisma.service';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { AttachmentsService } from '../subscriber/attachments/attachments.service';

@Module({
    imports: [HttpModule],
    controllers: [ProfileController],
    providers: [PrismaService, ProfileService, DataHelper, AttachmentsService],
})
export class ProfileModule {}
