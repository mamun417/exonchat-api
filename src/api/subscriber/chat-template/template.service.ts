import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

import { chat_template } from '@prisma/client';
import { DataHelper } from 'src/helper/data-helper';

import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { UpdateTemplateActiveStateDto } from './dto/update-template-active-state.dto';
import { IntentsService } from '../intents/intents.service';

@Injectable()
export class ChatTemplateService {
    constructor(private prisma: PrismaService, private dataHelper: DataHelper, private intentService: IntentsService) {}

    async create(req: any, createTemplateDto: CreateTemplateDto) {
        const subscriberId = req.user.data.subscriber_id;
    }

    //need test
    async update(id: any, req: any, updateTemplateDto: UpdateTemplateDto) {
        const speech = await this.findOneWithException(id, req);
    }

    async updateActiveState(id: any, req: any, updateTemplateActiveStateDto: UpdateTemplateActiveStateDto) {
        await this.findOneWithException(id, req);
    }

    async findAll(req: any) {
        const andCond = [{ user_id: null }];

        const permissions = this.prisma.permission.findMany({
            where: {
                roles: {
                    every: {
                        users: {
                            every: {
                                id: req.user.data.id,
                                subscriber_id: req.user.data.subscriber_id,
                            },
                        },
                    },
                },
            },
        });

        if ('permission check') {
            andCond.push({ user_id: req.user.data.id });
        }

        return this.prisma.chat_department.findMany({
            where: {
                subscriber_id: req.user.data.subscriber_id,
                AND: andCond,
            },
        });
    }

    async findOne(id: string, req: any) {
        return this.prisma.chat_department.findFirst({
            where: {
                subscriber_id: req.user.data.subscriber_id,
                id: id,
            },
        });
    }

    async findOneWithException(id: string, req: any) {
        return this.dataHelper.getSingleDataWithException(async () => await this.findOne(id, req), 'chat_template');
    }
}
