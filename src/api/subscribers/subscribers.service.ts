import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';

import { PrismaService } from 'src/prisma.service';
import { subscriber } from '@prisma/client';

import { DataHelper } from 'src/helper/data-helper';
import * as bcrypt from 'bcrypt';

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

        const subscriber = await this.prisma.subscriber.findFirst({
            where: { subscriber_meta: { company_name: createSubscriberDto.company_name } },
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
            // console.log(e.response.data);
            throw new HttpException('AI App create failed. Please Contact support', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        const freeSubscription = await this.prisma.subscription.findUnique({
            where: { slug: 'free' },
        });

        // use transaction
        const createdSubscriber = await this.prisma.subscriber.create({
            data: {
                active: true,
                subscriber_meta: {
                    create: {
                        company_name: createSubscriberDto.company_name,
                        display_name: createSubscriberDto.company_display_name,
                    },
                },
                subscriber_secret: {
                    create: {
                        api_key: '123',
                    },
                },
                subscriber_ai: {
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
                user_meta: {
                    create: {
                        full_name: createSubscriberDto.full_name,
                        display_name: createSubscriberDto.display_name,
                    },
                },
                user_secret: {
                    create: { password: await bcrypt.hash(createSubscriberDto.password, await bcrypt.genSalt()) },
                },
                role: {
                    connect: {
                        id: adminRole.id,
                    },
                },
                socket_session: {
                    create: {
                        init_ip: 'user_ip',
                        init_user_agent: 'user_browser',
                        use_for: 'user',
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
        return this.prisma.subscriber.findFirst({
            where: { subscriber_secret: { api_key } },
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
