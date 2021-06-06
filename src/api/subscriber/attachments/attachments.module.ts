import { Module } from '@nestjs/common';
import { AttachmentsController } from './attachments.controller';
import { PrismaService } from 'src/prisma.service';
import { DataHelper } from 'src/helper/data-helper';
import { AttachmentsService } from './attachments.service';

@Module({
    imports: [],
    controllers: [AttachmentsController],
    providers: [PrismaService, DataHelper, AttachmentsService],
})
export class AttachmentsModule {}
