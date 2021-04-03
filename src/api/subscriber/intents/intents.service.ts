import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

import { CreateIntentDto } from './dto/create-intent.dto';

@Injectable()
export class IntentsService {
    constructor(private prisma: PrismaService) {}

    async create(req: any, createIntentDto: CreateIntentDto) {
        const subscriberId = req.user.data.subscriber_id;

        const getIntent = await this.prisma.intent.findFirst({
            where: {
                tag: createIntentDto.tag,
                subscriber_id: subscriberId,
            },
        });

        return getIntent;

        // return createIntentDto.description || null;

        // return this.prisma.intent.create({
        //     data: {
        //         tag: createIntentDto.tag,
        //         description: createIntentDto.description,
        //         active: createIntentDto.active,
        //         // intent_actions: {
        //         //     create: {
        //         //         type: createIntentDto.type,
        //         //         action_name: createIntentDto.action_name,
        //         //         content: createIntentDto.content,
        //         //         external_path: createIntentDto.external_path,
        //         //         subscriber: {
        //         //             connect: { id: subscriberId },
        //         //         },
        //         //     },
        //         // },
        //         subscriber: {
        //             connect: { id: subscriberId },
        //         },
        //     },
        //     include: {
        //         intent_actions: true,
        //     },
        // });
    }
}
