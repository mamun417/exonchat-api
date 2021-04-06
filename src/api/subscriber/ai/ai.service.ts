import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

import { ReplyAiDto } from './dto/reply-ai.dto';

@Injectable()
export class AiService {
    constructor(private prisma: PrismaService) {}

    async aiReply(req: any, replyAiDto: ReplyAiDto) {
        const subscriberId = req.user.data.subscriber_id;
        // check ai can reply setting

        let finalIntent = null;

        const getIntent = await this.prisma.speech_recognition.findFirst({
            where: {
                speech: replyAiDto.msg,
                active: true,
                // confidence: 'check up to',
                subscriber_id: subscriberId,
                OR: [{ forced_intent: true }, { resolved: true }],
            },
            include: {
                intent: {
                    include: { intent_action: true },
                },
            },
        });

        if (getIntent) {
            finalIntent = getIntent.intent;
        }

        if (!getIntent && 'check for can auto get from ai & auto confidence level') {
            // ai response
        }

        if (finalIntent) {
            if (finalIntent.intent_action.type === 'static') {
                return finalIntent.intent_action.content;
            } else if (finalIntent.intent_action.type === 'action') {
            } else if (finalIntent.intent_action.type === 'external') {
            } else {
                return null;
            }
        }
    }
}
