import { HttpException, HttpService, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

import { CreateIntentDto } from './dto/create-intent.dto';

import { intent } from '@prisma/client';
import { DataHelper } from 'src/helper/data-helper';
import { UpdateIntentDto } from './dto/update-intent.dto';
import { UpdateIntentActiveStateDto } from './dto/update-intent-active-state.dto';

@Injectable()
export class IntentsService {
    constructor(private prisma: PrismaService, private dataHelper: DataHelper, private httpService: HttpService) {}

    async create(req: any, createIntentDto: CreateIntentDto) {
        const subscriberId = req.user.data.subscriber_id;

        const getIntent = await this.prisma.intent.findFirst({
            where: {
                tag: createIntentDto.tag,
                subscriber_id: subscriberId,
            },
        });

        if (getIntent) throw new HttpException(`Already Created with this Intent Tag`, HttpStatus.CONFLICT);

        let content = '';

        if (createIntentDto.type === 'action') {
            content = createIntentDto.action_name;
        } else if (createIntentDto.type === 'static') {
            content = createIntentDto.content;
        } else if (createIntentDto.type === 'external') {
            content = createIntentDto.external_path;
        }

        return this.prisma.intent.create({
            data: {
                tag: createIntentDto.tag,
                description: createIntentDto.description,
                active: createIntentDto.active,
                submit_to_ai: createIntentDto.connect_with_ai,
                intent_action: {
                    create: {
                        type: createIntentDto.type,
                        content: content,
                        subscriber: {
                            connect: { id: subscriberId },
                        },
                    },
                },
                subscriber: {
                    connect: { id: subscriberId },
                },
            },
            include: {
                intent_action: true,
            },
        });
    }

    async update(id: any, req: any, updateIntentDto: UpdateIntentDto) {
        const intent = await this.findOneWithException(id, req);

        let removeFromAi = false;

        // if user not wants to resolve with ai then its for remove if its submitted
        if (!updateIntentDto.connect_with_ai) {
            removeFromAi = true;
        }

        let content = '';

        if (updateIntentDto.type === 'action') {
            content = updateIntentDto.action_name;
        } else if (updateIntentDto.type === 'static') {
            content = updateIntentDto.content;
        } else if (updateIntentDto.type === 'external') {
            content = updateIntentDto.external_path;
        }

        return this.prisma.intent.update({
            where: { id: id },
            data: {
                description: updateIntentDto.description,
                active: updateIntentDto.active,
                submit_to_ai: updateIntentDto.connect_with_ai,
                remove_from_ai: removeFromAi,
                intent_action: {
                    update: {
                        type: updateIntentDto.type,
                        content: content,
                    },
                },
            },
            include: {
                intent_action: true,
            },
        });
    }

    async updateActiveState(id: any, req: any, updateIntentActiveStateDto: UpdateIntentActiveStateDto) {
        await this.findOneWithException(id, req);

        return this.prisma.intent.update({
            where: { id: id },
            data: {
                active: updateIntentActiveStateDto.active,
            },
            include: {
                intent_action: true,
            },
        });
    }

    async findAll(req: any, query: any) {
        const filterHelper = this.dataHelper.paginationAndFilter(
            ['p', 'pp', { name: 'active', type: 'boolean' }],
            query,
        );

        // console.log(filterHelper);

        return this.prisma.intent.findMany({
            where: {
                subscriber_id: req.user.data.subscriber_id,
                for_delete: false,
                ...filterHelper.where,
            },
            include: {
                intent_action: true,
            },
            orderBy: {
                created_at: 'desc',
            },
            ...filterHelper.pagination,
        });
    }

    async delete(id: any, req: any) {
        await this.findOneWithException(id, req);

        return this.prisma.intent.update({
            where: { id: id },
            data: {
                for_delete: true,
            },
        });
    }

    async findOne(id: string, req: any): Promise<intent> {
        return this.prisma.intent.findFirst({
            where: {
                id: id,
                subscriber_id: req.user.data.subscriber_id,
            },
            include: {
                intent_action: true,
            },
        });
    }

    async findOneWithException(id: string, req: any): Promise<intent> {
        return this.dataHelper.getSingleDataWithException(async () => await this.findOne(id, req), 'intent');
    }
}
