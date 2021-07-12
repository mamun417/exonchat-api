import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateOfflineChatReqDto } from './dto/create-offline-chat-req.dto';

@Injectable()
export class OfflineChatReqService {
    constructor(private prisma: PrismaService) {}

    async create(req: any, createRatingDto: CreateOfflineChatReqDto) {
        const subscriberId = req.user.data.socket_session.subscriber_id;
        const socketSessionId = req.user.data.socket_session.id;

        return await this.prisma.offline_chat_req.create({
            data: {
                name: createRatingDto.name,
                email: createRatingDto.email,
                subject: createRatingDto.subject,
                message: createRatingDto.message,
                priority: createRatingDto.priority || '',
                subscriber: { connect: { id: subscriberId } },
                chat_department: { connect: { id: createRatingDto.chat_department_id } },
                socket_session: { connect: { id: socketSessionId } },
            },
        });
    }
}
