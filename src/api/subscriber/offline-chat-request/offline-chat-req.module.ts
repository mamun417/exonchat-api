import { HttpModule, Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { OfflineChatReqController } from './offline-chat-req.controller';
import { OfflineChatReqService } from './offline-chat-req.service';

@Module({
    imports: [HttpModule],
    controllers: [OfflineChatReqController],
    providers: [PrismaService, OfflineChatReqService],
})
export class OfflineChatReq {}
