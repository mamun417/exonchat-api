import { Injectable } from '@nestjs/common';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscriber } from './entities/subscriber.entity';
import { ChatClient } from '../chat-clients/entities/chat-client.entity';

import { PrismaService } from '../../prisma.service';
import { subscriber } from '@prisma/client';

import { DataHelper } from '../../helper/data-helper';

@Injectable()
export class SubscribersService {
    constructor(private prisma: PrismaService, private dataHelper: DataHelper) {}

    async create(createSubscriberDto: CreateSubscriberDto): Promise<subscriber> {
        const adminRole = await this.prisma.role.findFirst({
            where: { slug: 'admin', subscriber_id: null },
        });

        return this.prisma.subscriber.create({
            data: {
                chat_agents: {
                    create: [
                        {
                            email: createSubscriberDto.email,
                            password: createSubscriberDto.email,
                            role: {
                                connect: {
                                    id: adminRole.id,
                                },
                            },
                        },
                    ],
                },
            },
        });
    }

    async findAll(): Promise<subscriber[]> {
        return this.prisma.subscriber.findMany();
    }

    async findOne(id: string): Promise<subscriber> {
        return await this.dataHelper.getSingleDataWithException(
            async () => await this.prisma.subscriber.findUnique({ where: { id: id } }),
        );
    }

    // async getChatClientsByApiKey(api_key: string): Promise<ChatClient[]> {
    //     const subscriber = await this.subscribeRepository.findOne({
    //         where: {
    //             api_key,
    //         },
    //         relations: ['chat_clients'],
    //     });

    //     return subscriber['chat_clients'];
    // }

    // async fineOneByApiKey(api_key: string): Promise<Subscriber> {
    //     return await this.subscribeRepository.findOne({
    //         where: {
    //             api_key,
    //         },
    //     });
    // }

    // async getChatClientByApiKey(apy_key: string) {
    //     return await this.subscribeRepository.findOne({
    //         where: {
    //             apy_key,
    //         },
    //     });
    // }

    // update(id: number, updateSubscriberDto: UpdateSubscriberDto) {
    //     return `This action updates a #${id} subscriber`;
    // }

    // remove(id: number) {
    //     return `This action removes a #${id} subscriber`;
    // }
}
