import { HttpException, HttpStatus, Injectable, Query } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

import { DataHelper } from 'src/helper/data-helper';

import { CreateChatBotDto } from './dto/create-chat-bot.dto';
import { UpdateChatBotDto } from './dto/update-chat-bot.dto';
import { UpdateChatBotActiveStateDto } from './dto/update-chat-bot-active-state.dto';
import { IntentsService } from '../intents/intents.service';
import { ChatDepartmentService } from '../chat-department/department.service';
import { CreateChatBotItemDto } from './dto/create-chat-bot-item.dto';
import { UpdateChatBotItemDto } from './dto/update-chat-bot-item.dto';

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
                content: createChatBotDto.content || null,
                active: createChatBotDto.active,
                subscriber: { connect: { id: subscriberId } },
                ...connector,
            },
        });
    }

    async createBotItem(req: any, createChatBotItemDto: CreateChatBotItemDto) {
        const subscriberId = req.user.data.subscriber_id;

        const chatBotItem = await this.prisma.chat_bot_item.findUnique({
            where: {
                chat_bot_item_identifier: {
                    tag: createChatBotItemDto.tag,
                    subscriber_id: subscriberId,
                },
            },
        });

        if (chatBotItem) throw new HttpException(`Already Created with this tag`, HttpStatus.CONFLICT);

        const connector: any = {
            chat_bots: [],
        };

        if (createChatBotItemDto.intent_id) {
            await this.intentService.findOneWithException(createChatBotItemDto.intent_id, req);

            connector.intent = { connect: { id: createChatBotItemDto.intent_id } };
        }

        if (createChatBotItemDto.resolve_to_chat_bot_id) {
            await this.findOneBotItemWithException(createChatBotItemDto.resolve_to_chat_bot_id, req);

            connector.resolve_to_chat_bot = { connect: { id: createChatBotItemDto.resolve_to_chat_bot_id } };
        }

        if (createChatBotItemDto.chat_bot_ids && createChatBotItemDto.chat_bot_ids) {
            for (const chat_bot of createChatBotItemDto.chat_bot_ids) {
                await this.findOneBotItemWithException(chat_bot, req);

                connector.chat_bots.connect.push({ id: chat_bot });
            }
        }

        return this.prisma.chat_bot_item.create({
            data: {
                tag: createChatBotItemDto.tag,
                description: createChatBotItemDto.description,
                display_name: createChatBotItemDto.display_name,
                content: createChatBotItemDto.content || null,
                active: createChatBotItemDto.active,
                subscriber: { connect: { id: subscriberId } },
                ...connector,
            },
        });
    }

    async update(id: any, req: any, updateChatBotDto: UpdateChatBotDto) {
        const chatBot = await this.findOneWithException(id, req);

        const connector: any = {
            chat_bot_items: {
                set: [], // need test if empty. we need to disconnect all relation if empty
            },
        };

        if (updateChatBotDto.department_id && updateChatBotDto.department_id !== chatBot.chat_department_id) {
            await this.chatDepartmentService.findOneWithException(updateChatBotDto.department_id, req);

            connector.chat_department = { connect: { id: updateChatBotDto.department_id } };
        }

        // if was but not now then disconnect
        if (chatBot.chat_department_id && !updateChatBotDto.department_id) {
            connector.chat_department = { disconnect: true };
        }

        if (updateChatBotDto.chat_bot_items && updateChatBotDto.chat_bot_items.length) {
            for (const chat_bot_item of updateChatBotDto.chat_bot_items) {
                await this.findOneWithException(chat_bot_item, req);

                connector.chat_bot_items.set.push({ id: chat_bot_item });
            }
        }

        return this.prisma.chat_bot.update({
            where: { id: id },
            data: {
                description: updateChatBotDto.description,
                content: updateChatBotDto.content || null,
                active: updateChatBotDto.active,
                ...connector,
            },
        });
    }

    async updateBotItem(id: any, req: any, updateChatBotItemDto: UpdateChatBotItemDto) {
        const chatBotItem = await this.findOneBotItemWithException(id, req);

        const connector: any = {
            chat_bots: {
                set: [], // need test if empty. we need to disconnect all relation if empty
            },
        };

        if (updateChatBotItemDto.intent_id && updateChatBotItemDto.intent_id !== chatBotItem.intent_id) {
            await this.intentService.findOneWithException(updateChatBotItemDto.intent_id, req);

            connector.intent = { connect: { id: updateChatBotItemDto.intent_id } };
        }

        // if was but not now then disconnect
        if (chatBotItem.intent_id && !updateChatBotItemDto.intent_id) {
            connector.intent = { disconnect: true };
        }

        if (
            updateChatBotItemDto.resolve_to_chat_bot_id &&
            updateChatBotItemDto.resolve_to_chat_bot_id !== chatBotItem.resolve_to_chat_bot_id
        ) {
            await this.findOneWithException(updateChatBotItemDto.resolve_to_chat_bot_id, req);

            connector.intent = { connect: { id: updateChatBotItemDto.resolve_to_chat_bot_id } };
        }

        // if was but not now then disconnect
        if (chatBotItem.resolve_to_chat_bot_id && !updateChatBotItemDto.resolve_to_chat_bot_id) {
            connector.resolve_to_chat_bot = { disconnect: true };
        }

        if (updateChatBotItemDto.chat_bot_ids && updateChatBotItemDto.chat_bot_ids.length) {
            for (const chat_bot of updateChatBotItemDto.chat_bot_ids) {
                await this.findOneWithException(chat_bot, req);

                connector.chat_bots.set.push({ id: chat_bot });
            }
        }

        return this.prisma.chat_bot.update({
            where: { id: id },
            data: {
                description: updateChatBotItemDto.description,
                display_name: updateChatBotItemDto.display_name,
                content: updateChatBotItemDto.content || null,
                active: updateChatBotItemDto.active,
                ...connector,
            },
        });
    }

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

    // UpdateChatBotActiveStateDto both are same
    async updateBotItemActiveState(id: any, req: any, updateChatBotActiveStateDto: UpdateChatBotActiveStateDto) {
        await this.findOneBotItemWithException(id, req);

        return this.prisma.chat_bot_item.update({
            where: {
                id: id,
            },
            data: {
                active: updateChatBotActiveStateDto.active,
            },
        });
    }

    async delete(id: any, req: any) {
        // need to think
        return;
        // await this.findOneWithException(id, req);
        //
        // const adminUser = await this.prisma.user.findFirst({
        //     where: { id: req.user.data.id, role: { slug: 'admin' } },
        // });
        //
        // if (adminUser) {
        //     return this.prisma.chat_bot.delete({
        //         where: {
        //             id: id,
        //         },
        //     });
        // }
        //
        // throw new HttpException(`You are not the resource owner`, HttpStatus.FORBIDDEN);
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
