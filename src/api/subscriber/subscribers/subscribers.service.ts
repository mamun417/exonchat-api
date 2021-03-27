import { Injectable } from '@nestjs/common';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';

import { PrismaService } from '../../../prisma.service';
import { subscriber } from '@prisma/client';

import { DataHelper } from '../../../helper/data-helper';

@Injectable()
export class SubscribersService {
    constructor(private prisma: PrismaService, private dataHelper: DataHelper) {}

    async create(createSubscriberDto: CreateSubscriberDto): Promise<subscriber> {
        const adminRole = await this.prisma.role.findFirst({
            where: { slug: 'admin', subscriber_id: null },
        });

        return this.prisma.subscriber.create({
            data: {
                company_name: createSubscriberDto.company_name,
                display_name: createSubscriberDto.company_display_name,
                users: {
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

    async fineOneByApiKey(api_key: string): Promise<subscriber> {
        return await this.dataHelper.getSingleDataWithException(
            async () =>
                await this.prisma.subscriber.findUnique({
                    where: { api_key },
                }),
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
