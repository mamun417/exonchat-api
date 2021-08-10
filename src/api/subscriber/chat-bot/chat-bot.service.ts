import { HttpException, HttpStatus, Injectable, Query } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

import { DataHelper } from 'src/helper/data-helper';

import { CreateChatBotDto } from './dto/create-chat-bot.dto';
import { UpdateChatBotDto } from './dto/update-chat-bot.dto';
import { UpdateChatBotActiveStateDto } from './dto/update-chat-bot-active-state.dto';
import { IntentsService } from '../intents/intents.service';
import { ChatDepartmentService } from '../chat-department/department.service';

@Injectable()
export class ChatBotService {
    constructor(
        private prisma: PrismaService,
        private dataHelper: DataHelper,
        private intentService: IntentsService,
        private chatDepartmentService: ChatDepartmentService,
    ) {}

    async create(req: any, createChatBotDto: CreateChatBotDto) {
        const subscriberId = req.user.data.subscriber_id;

        const chatBot = await this.prisma.chat_bot.findUnique({
            where: {
                chat_bot_identifier: {
                    tag: createChatBotDto.tag,
                    subscriber_id: subscriberId,
                },
            },
        });

        if (chatBot) throw new HttpException(`Already Created with this tag`, HttpStatus.CONFLICT);

        const connector: any = {
            chat_bot_items: [],
        };

        if (createChatBotDto.department_id) {
            await this.chatDepartmentService.findOneWithException(createChatBotDto.department_id, req);

            connector.chat_department = { connect: { id: createChatBotDto.department_id } };
        }

        if (createChatBotDto.chat_bot_items && createChatBotDto.chat_bot_items.length) {
            for (const chat_bot_item of createChatBotDto.chat_bot_items) {
                await this.findOneWithException(chat_bot_item, req);

                connector.chat_bot_items.connect.push({ id: chat_bot_item });
            }
        }

        return this.prisma.chat_bot.create({
            data: {
                tag: createChatBotDto.tag,
                description: createChatBotDto.description,
                content: createChatBotDto.content,
                active: createChatBotDto.active,
                subscriber: { connect: { id: subscriberId } },
                ...connector,
            },
        });
    }

    async update(id: any, req: any, updateChatBotDto: UpdateChatBotDto) {}

    async updateActiveState(id: any, req: any, updateChatBotActiveStateDto: UpdateChatBotActiveStateDto) {
        await this.findOneWithException(id, req);

        return this.prisma.chat_bot.update({
            where: {
                id: id,
            },
            data: {
                active: updateChatBotActiveStateDto.active,
            },
        });
    }

    async delete(id: any, req: any) {
        await this.findOneWithException(id, req);

        const adminUser = await this.prisma.user.findFirst({
            where: { id: req.user.data.id, role: { slug: 'admin' } },
        });

        if (adminUser) {
            return this.prisma.chat_bot.delete({
                where: {
                    id: id,
                },
            });
        }

        throw new HttpException(`You are not the resource owner`, HttpStatus.FORBIDDEN);
    }

    async findAll(req: any, query: any) {
        const filterHelper = this.dataHelper.paginationAndFilter([{ name: 'tag', type: 'contains' }], query);

        return this.prisma.chat_bot.findMany({
            where: {
                subscriber_id: req.user.data.subscriber_id,
                ...filterHelper.where,
            },
            orderBy: {
                created_at: 'desc',
            },
        });
    }

    async findOne(id: string, req: any) {
        return this.prisma.chat_bot.findFirst({
            where: {
                subscriber_id: req.user.data.subscriber_id,
                id: id,
            },
        });
    }

    async findOneWithException(id: string, req: any) {
        return this.dataHelper.getSingleDataWithException(async () => await this.findOne(id, req), 'chat_bot_item');
    }

    async findOneBotItem(id: string, req: any) {
        return this.prisma.chat_bot_item.findFirst({
            where: {
                subscriber_id: req.user.data.subscriber_id,
                id: id,
            },
        });
    }

    async findOneBotItemWithException(id: string, req: any) {
        return this.dataHelper.getSingleDataWithException(
            async () => await this.findOneBotItem(id, req),
            'chat_bot_item',
        );
    }
}
