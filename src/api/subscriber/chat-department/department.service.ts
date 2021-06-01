import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

import { chat_department } from '@prisma/client';
import { DataHelper } from 'src/helper/data-helper';

import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { UpdateDepartmentActiveStateDto } from './dto/update-department-active-state.dto';
import { UsersService } from '../users/users.service';

import * as _l from 'lodash';

@Injectable()
export class ChatDepartmentService {
    constructor(private prisma: PrismaService, private dataHelper: DataHelper, private userService: UsersService) {}

    async create(req: any, createDepartmentDto: CreateDepartmentDto) {
        const subscriberId = req.user.data.subscriber_id;

        const department = await this.prisma.chat_department.findUnique({
            where: {
                tag_identifier: {
                    subscriber_id: subscriberId,
                    tag: createDepartmentDto.tag,
                },
            },
        });

        if (department) throw new HttpException(`Already Created with this tag`, HttpStatus.CONFLICT);

        let userConnector: any = {};

        if (createDepartmentDto.user_ids && createDepartmentDto.user_ids.length) {
            userConnector = { users: { connect: [] } };

            for (const user_id of createDepartmentDto.user_ids) {
                await this.userService.findOneWithException(user_id, req);

                userConnector.users.connect.push({ id: user_id });
            }
        }

        return this.prisma.chat_department.create({
            data: {
                tag: createDepartmentDto.tag,
                description: createDepartmentDto.description,
                active: createDepartmentDto.active,
                subscriber: { connect: { id: subscriberId } },
                ...userConnector,
            },
            include: { users: true },
        });
    }

    //need test
    async update(id: any, req: any, updateDepartmentDto: UpdateDepartmentDto) {
        const department = await this.findOneWithUsersException(id, req);

        let usersRelationUpdater: any = {};

        if (updateDepartmentDto.user_ids) {
            usersRelationUpdater = { users: { set: [] } };

            if (updateDepartmentDto.user_ids.length) {
                for (const user_id of updateDepartmentDto.user_ids) {
                    await this.userService.findOneWithException(user_id, req);

                    usersRelationUpdater.users.set.push({ id: user_id });
                }
            }
        }

        return this.prisma.chat_department.update({
            where: {
                id: id,
            },
            data: {
                description: updateDepartmentDto.description,
                active: updateDepartmentDto.active,
                ...usersRelationUpdater,
            },
            include: { users: true },
        });
    }

    async delete(id: any, req: any) {
        await this.findOneWithException(id, req);

        return this.prisma.chat_department.delete({
            where: { id: id },
        });
    }

    async updateActiveState(id: any, req: any, updateDepartmentActiveStateDto: UpdateDepartmentActiveStateDto) {
        await this.findOneWithException(id, req);

        return this.prisma.chat_department.update({
            where: {
                id: id,
            },
            data: {
                active: updateDepartmentActiveStateDto.active,
            },
            include: {
                users: true,
            },
        });
    }

    async findAll(req: any) {
        return this.prisma.chat_department.findMany({
            where: {
                subscriber_id: req.user.data.socket_session.subscriber_id,
            },
            orderBy: {
                created_at: 'desc',
            },
            include: { users: !!req.user.data.socket_session.user_id },
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
        return this.dataHelper.getSingleDataWithException(async () => await this.findOne(id, req), 'chat_Department');
    }

    async findOneWithUsers(id: string, req: any) {
        return this.prisma.chat_department.findFirst({
            where: {
                subscriber_id: req.user.data.subscriber_id,
                id: id,
            },
            include: {
                users: true,
            },
        });
    }

    async findOneWithUsersException(id: string, req: any) {
        return this.dataHelper.getSingleDataWithException(
            async () => await this.findOneWithUsers(id, req),
            'chat_Department',
        );
    }
}
