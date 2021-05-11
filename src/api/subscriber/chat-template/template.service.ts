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

        let template: any = null;
        const connector: any = {};

        const adminUser = await this.prisma.user.findFirst({
            where: { id: req.user.data.id, role: { slug: 'admin' } },
        });

        //only admin will see own input. all others are own by default
        if (adminUser && !createTemplateDto.own) {
            template = await this.prisma.chat_template.findFirst({
                where: {
                    subscriber_id: subscriberId,
                    tag: createTemplateDto.tag,
                    user_id: null,
                },
            });
        } else {
            connector.user = { connect: { id: req.user.data.id } };

            template = await this.prisma.chat_template.findFirst({
                where: {
                    subscriber_id: subscriberId,
                    tag: createTemplateDto.tag,
                    user_id: req.user.data.id,
                },
            });
        }

        if (template) throw new HttpException(`Already Created with this tag`, HttpStatus.CONFLICT);

        if (createTemplateDto.department_id) {
            await this.chatDepartmentService.findOneWithException(createTemplateDto.department_id, req);

            connector.chat_Department = { connect: { id: createTemplateDto.department_id } };
        }

        if (createTemplateDto.intent_id) {
            await this.intentService.findOneWithException(createTemplateDto.intent_id, req);

            connector.intent = { connect: { id: createTemplateDto.intent_id } };
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
            include: { intent: { include: { intent_action: true } } },
        });
    }

    //you cant change owner of the template. for that delete & create a new one
    async update(id: any, req: any, updateTemplateDto: UpdateTemplateDto) {
        const subscriberId = req.user.data.subscriber_id;

        const template = await this.findOneWithException(id, req);

        if (template.user_id && template.user_id !== req.user.data.id) {
            throw new HttpException(`You are not the resource owner`, HttpStatus.FORBIDDEN);
        }

        const connector: any = {};
        const disconnector: any = {};

        if (updateTemplateDto.department_id) {
            if (template.department_id !== updateTemplateDto.department_id) {
                await this.chatDepartmentService.findOneWithException(updateTemplateDto.department_id, req);

                connector.chat_Department = { connect: { id: updateTemplateDto.department_id } };
                disconnector.chat_Department = { disconnect: { id: template.department_id } };
            }
        } else {
            if (template.department_id) {
                disconnector.chat_Department = { disconnect: { id: template.department_id } };
            }
        }

        if (updateTemplateDto.intent_id) {
            if (template.intent_id !== updateTemplateDto.intent_id) {
                await this.intentService.findOneWithException(updateTemplateDto.intent_id, req);

                connector.intent = { connect: { id: updateTemplateDto.intent_id } };
                disconnector.intent = { disconnect: { id: template.intent_id } };
            }
        } else {
            if (template.intent_id) {
                disconnector.intent = { disconnect: { id: template.intent_id } };
            }
        }

        return this.prisma.chat_template.update({
            where: { id: id },
            data: {
                description: updateTemplateDto.description,
                content: updateTemplateDto.intent_id ? null : updateTemplateDto.content,
                active: updateTemplateDto.active,
                subscriber: { connect: { id: subscriberId } },
                ...connector,
                ...disconnector,
            },
            include: { intent: { include: { intent_action: true } } },
        });
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

    async delete(id: any, req: any) {
        const template = await this.findOneWithException(id, req);

        const adminUser = await this.prisma.user.findFirst({
            where: { id: req.user.data.id, role: { slug: 'admin' } },
        });

        if ((adminUser && !template.user_id) || req.user.data.id === template.user_id) {
            return this.prisma.chat_template.delete({
                where: {
                    id: id,
                },
            });
        }

        throw new HttpException(`You are not the resource owner`, HttpStatus.FORBIDDEN);
    }

    async findAll(req: any) {
        return this.prisma.chat_template.findMany({
            where: {
                subscriber_id: req.user.data.subscriber_id,
                OR: [{ user_id: null }, { user_id: req.user.data.id }],
            },
            include: { intent: { include: { intent_action: true } } },
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
