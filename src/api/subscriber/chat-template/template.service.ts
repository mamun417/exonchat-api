import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

import { chat_template } from '@prisma/client';
import { DataHelper } from 'src/helper/data-helper';

import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { UpdateTemplateActiveStateDto } from './dto/update-template-active-state.dto';
import { IntentsService } from '../intents/intents.service';
import { ChatDepartmentService } from '../chat-department/department.service';

@Injectable()
export class ChatTemplateService {
    constructor(
        private prisma: PrismaService,
        private dataHelper: DataHelper,
        private intentService: IntentsService,
        private chatDepartmentService: ChatDepartmentService,
    ) {}

    async create(req: any, createTemplateDto: CreateTemplateDto) {
        const subscriberId = req.user.data.subscriber_id;

        const connector: any = {};

        if (createTemplateDto.department_id) {
            const chatDepartment = await this.chatDepartmentService.findOneWithException(
                createTemplateDto.department_id,
                req,
            );

            connector.chat_Department = { connect: { id: createTemplateDto.department_id } };
        }

        if (createTemplateDto.intent_id) {
            const chatDepartment = await this.intentService.findOneWithException(createTemplateDto.intent_id, req);

            connector.intent = { connect: { id: createTemplateDto.intent_id } };
        }

        if (createTemplateDto.own) {
            connector.user = { connect: { id: req.user.data.id } };
        }

        return this.prisma.chat_template.create({
            data: {
                tag: createTemplateDto.tag,
                description: createTemplateDto.description,
                content: createTemplateDto.intent_id ? null : createTemplateDto.content,
                active: createTemplateDto.active,
                subscriber: { connect: { id: subscriberId } },
                ...connector,
            },
        });
    }

    //need test
    async update(id: any, req: any, updateTemplateDto: UpdateTemplateDto) {
        const speech = await this.findOneWithException(id, req);
    }

    async updateActiveState(id: any, req: any, updateTemplateActiveStateDto: UpdateTemplateActiveStateDto) {
        await this.findOneWithException(id, req);

        return this.prisma.chat_template.update({
            where: {
                id: id,
            },
            data: {
                active: updateTemplateActiveStateDto.active,
            },
        });
    }

    async findAll(req: any) {
        return this.prisma.chat_template.findMany({
            where: {
                subscriber_id: req.user.data.subscriber_id,
                AND: [{ user_id: null }, { user_id: req.user.data.id }],
            },
        });
    }

    async findOne(id: string, req: any) {
        return this.prisma.chat_template.findFirst({
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
