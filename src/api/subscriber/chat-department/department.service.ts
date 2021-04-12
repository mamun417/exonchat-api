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

        const department = await this.prisma.chat_department.findFirst({
            where: {
                subscriber_id: subscriberId,
                tag: createDepartmentDto.tag,
            },
        });

        if (department) throw new HttpException(`Already Created with this tag`, HttpStatus.CONFLICT);

        let userConnector: any = {};

        if (createDepartmentDto.user_ids && createDepartmentDto.user_ids.length) {
            userConnector = { users: { connect: [] } };

            for (const user_id in createDepartmentDto.user_ids) {
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

        const usersInDepartment = department.users.length ? _l.map(department.users, 'id') : [];

        let userConnector: any = {};
        let userDisconnector: any = {};

        if (updateDepartmentDto.user_ids && updateDepartmentDto.user_ids.length) {
            userConnector = { users: { connect: [] } };
            userDisconnector = { users: { disconnect: [] } };

            for (const user_id in updateDepartmentDto.user_ids) {
                await this.userService.findOneWithException(user_id, req);

                if (!usersInDepartment.includes(user_id)) userConnector.users.connect.push({ id: user_id });
            }

            usersInDepartment.forEach((user_id) => {
                if (!updateDepartmentDto.user_ids.includes(user_id))
                    userDisconnector.user.disconnect.push({ id: user_id });
            });
        }

        return this.prisma.chat_department.update({
            where: {
                id: id,
            },
            data: {
                description: updateDepartmentDto.description,
                active: updateDepartmentDto.active,
                ...userConnector,
                ...userDisconnector,
            },
            include: { users: true },
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
        });
    }

    async findAll(req: any) {
        return this.prisma.chat_department.findMany({
            where: {
                subscriber_id: req.user.data.subscriber_id,
            },
            include: { users: true },
        });
    }

    async findOne(id: string, req: any) {
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