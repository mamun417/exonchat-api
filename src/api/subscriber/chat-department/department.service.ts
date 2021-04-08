import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

import { chat_department } from '@prisma/client';
import { DataHelper } from 'src/helper/data-helper';

import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { UpdateDepartmentActiveStateDto } from './dto/update-department-active-state.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class ChatDepartmentService {
    constructor(private prisma: PrismaService, private dataHelper: DataHelper, private userService: UsersService) {}

    async create(req: any, createDepartmentDto: CreateDepartmentDto) {
        const subscriberId = req.user.data.subscriber_id;

        return this.prisma.chat_department.create({
            data: {
                tag: createDepartmentDto.tag,
                description: createDepartmentDto.description,
                active: createDepartmentDto.active,
                subscriber: { connect: { id: subscriberId } },
            },
        });
    }

    //need test
    async update(id: any, req: any, updateDepartmentDto: UpdateDepartmentDto) {
        const speech = await this.findOneWithException(id, req);
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
}
