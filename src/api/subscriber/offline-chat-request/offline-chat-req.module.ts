import { HttpModule, Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { OfflineChatReqController } from './offline-chat-req.controller';
import { OfflineChatReqService } from './offline-chat-req.service';
import { DataHelper } from '../../../helper/data-helper';

@Module({
    imports: [HttpModule],
    controllers: [OfflineChatReqController],
    providers: [PrismaService, DataHelper, OfflineChatReqService],
})
export class OfflineChatReq {}
