import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

import { CreateIntentDto } from './dto/create-intent.dto';

import { intent } from '@prisma/client';
import { DataHelper } from 'src/helper/data-helper';
import { UpdateIntentDto } from './dto/update-intent.dto';
import { UpdateIntentActiveStateDto } from './dto/update-intent-active-state.dto';

@Injectable()
export class IntentsService {
    constructor(private prisma: PrismaService, private dataHelper: DataHelper) {}

    async create(req: any, createIntentDto: CreateIntentDto) {
        const subscriberId = req.user.data.subscriber_id;

        const getIntent = await this.prisma.intent.findFirst({
            where: {
                tag: createIntentDto.tag,
                subscriber_id: subscriberId,
            },
        });

        if (getIntent) throw new HttpException(`Already Created with this Intent Tag`, HttpStatus.CONFLICT);

        return this.prisma.intent.create({
            data: {
                tag: createIntentDto.tag,
                description: createIntentDto.description,
                active: createIntentDto.active,
                intent_action: {
                    create: {
                        type: createIntentDto.type,
                        action_name: createIntentDto.action_name,
                        content: createIntentDto.content,
                        external_path: createIntentDto.external_path,
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
        await this.findOneWithException(id, req);

        return this.prisma.intent.update({
            where: { id: id },
            data: {
                description: updateIntentDto.description,
                active: updateIntentDto.active,
                intent_action: {
                    update: {
                        type: updateIntentDto.type,
                        action_name: updateIntentDto.action_name,
                        content: updateIntentDto.content,
                        external_path: updateIntentDto.external_path,
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

    async findAll(req: any) {
        return this.prisma.intent.findMany({
            where: {
                subscriber_id: req.user.data.subscriber_id,
            },
            include: {
                intent_action: true,
            },
            orderBy: {
                created_at: 'desc',
            },
        });
    }

    async findOne(id: string, req: any): Promise<intent> {
        return this.prisma.intent.findFirst({
            where: {
                id: id,
                subscriber_id: req.user.data.subscriber_id,
            },
        });
    }

    async findOneWithException(id: string, req: any): Promise<intent> {
        return this.dataHelper.getSingleDataWithException(async () => await this.findOne(id, req), 'intent');
    }
}
