import { HttpException, HttpService, HttpStatus, Injectable } from '@nestjs/common';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';

import { PrismaService } from 'src/prisma.service';
import { subscriber } from '@prisma/client';

import { DataHelper } from 'src/helper/data-helper';

@Injectable()
export class SubscribersService {
    constructor(private prisma: PrismaService, private dataHelper: DataHelper, private httpService: HttpService) {}

    async create(createSubscriberDto: CreateSubscriberDto): Promise<subscriber> {
        const adminRole = await this.prisma.role.findFirst({
            where: { slug: 'admin', subscriber_id: null },
        });

        if (!adminRole) {
            throw new HttpException('Something went wrong. Please contact support', HttpStatus.NOT_FOUND);
        }

        const subscriber = await this.prisma.subscriber.findUnique({
            where: { company_name: createSubscriberDto.company_name },
        });

        if (subscriber) {
            throw new HttpException('Company with that name already taken', HttpStatus.CONFLICT);
        }

        let aiAppCreateRes: any = {};

        try {
            aiAppCreateRes = await this.httpService
                .post(
                    'https://api.wit.ai/apps',
                    {
                        name: createSubscriberDto.company_name,
                        lang: 'en',
                        private: true,
                    },
                    { headers: { Authorization: `Bearer M4N62UXFS75RPPA27NMR2ZZVXLF7LJDF` } },
                )
                .toPromise();
        } catch (e) {
            console.log(e.response.data);
            throw new HttpException('AI App create failed. Please Contact support', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        const freeSubscription = await this.prisma.subscription.findUnique({
            where: { slug: 'free' },
        });

        // use transaction
        const createdSubscriber = await this.prisma.subscriber.create({
            data: {
                company_name: createSubscriberDto.company_name,
                display_name: createSubscriberDto.company_display_name,
                active: true,
                ai: {
                    create: {
                        app_name: createSubscriberDto.company_name,
                        app_id: aiAppCreateRes.data.app_id,
                        access_token: aiAppCreateRes.data.access_token,
                    },
                },
                subscriber_subscription: {
                    create: {
                        subscription: { connect: { id: freeSubscription.id } },
                    },
                },
            },
        });

        await this.prisma.user.create({
            data: {
                email: createSubscriberDto.email,
                password: createSubscriberDto.password,
                user_meta: {
                    create: {
                        full_name: createSubscriberDto.full_name,
                        display_name: createSubscriberDto.display_name,
                    },
                },
                role: {
                    connect: {
                        id: adminRole.id,
                    },
                },
                socket_sessions: {
                    create: {
                        ip: 'user',
                        subscriber: { connect: { id: createdSubscriber.id } },
                    },
                },
                subscriber: { connect: { id: createdSubscriber.id } },
            },
        });

        return createdSubscriber;
    }

    async findAll(): Promise<subscriber[]> {
        return this.prisma.subscriber.findMany();
    }

    async findOne(id: string): Promise<subscriber> {
        return this.prisma.subscriber.findUnique({ where: { id: id } });
    }

    async findOneWithException(id: string): Promise<subscriber> {
        return await this.dataHelper.getSingleDataWithException(async () => await this.findOne(id), 'subscriber');
    }

    async findOneByApiKey(api_key: string): Promise<subscriber> {
        return this.prisma.subscriber.findUnique({
            where: { api_key },
        });
    }

    async findOneByApiKeyWithException(api_key: string): Promise<subscriber> {
        return await this.dataHelper.getSingleDataWithException(
            async () => await this.findOneByApiKey(api_key),
            'subscriber',
        );
    }

    async findAiInfoBySubscriberId(id: string) {
        return this.prisma.subscriber_ai.findUnique({
            where: {
                subscriber_id: id,
            },
        });
    }

    async findAiInfoBySubscriberIdWithExecption(id: string, errMsg = '', httpStatus: any = null) {
        return await this.dataHelper.getSingleDataWithException(
            async () => await this.findAiInfoBySubscriberId(id),
            'subscriber_ai',
            errMsg,
            httpStatus,
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
