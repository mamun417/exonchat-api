import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateOfflineChatReqDto } from './dto/create-offline-chat-req.dto';
import { DataHelper } from '../../../helper/data-helper';

@Injectable()
export class OfflineChatReqService {
    constructor(private prisma: PrismaService, private dataHelper: DataHelper) {}

    async findAll(req: any, query: any) {
        const filterHelper = this.dataHelper.paginationAndFilter(
            [
                'p',
                'pp',
                { name: 'name', type: 'contains' },
                // { name: 'email', type: 'contains' },
                // { name: 'subject', type: 'contains' },
                // { name: 'message', type: 'contains' },
            ],
            query,
        );

        const whereQuery = {
            subscriber_id: req.user.data.socket_session.subscriber_id,
            OR: filterHelper.where,
        };

        const count = await this.prisma.offline_chat_req.count({
            where: whereQuery,
        });

        const result = await this.prisma.offline_chat_req.findMany({
            where: whereQuery,
            orderBy: {
                created_at: 'desc',
            },
            include: {
                chat_department: true,
            },
            ...filterHelper.pagination,
        });

        return {
            chat_requests: {
                data: result,
                pagination: {
                    current_page: query.hasOwnProperty('p') ? parseInt(query.p) : 1,
                    total_page: Math.ceil(count / (query.hasOwnProperty('pp') ? parseInt(query.pp) : 10)),
                    total: count,
                },
            },
        };
    }

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
