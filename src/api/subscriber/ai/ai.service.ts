import { HttpException, HttpService, HttpStatus, Injectable } from '@nestjs/common';
import { SubscribersService } from 'src/api/subscribers/subscribers.service';
import { PrismaService } from 'src/prisma.service';
import { ConversationsService } from '../conversations/conversations.service';

import { ReplyAiDto } from './dto/reply-ai.dto';

@Injectable()
export class AiService {
    constructor(
        private prisma: PrismaService,
        private conversationService: ConversationsService,
        private subscriberService: SubscribersService,
        private httpService: HttpService,
    ) {}

    async aiReply(req: any, replyAiDto: ReplyAiDto) {
        const subscriberId = req.user.data.subscriber_id;
        const socketSessionId = req.user.data.id;
        // check ai can reply setting

        const conversation = await this.conversationService.findOneWithException(
            replyAiDto.conv_id,
            {
                subscriber_id: subscriberId,
                conversation_sessions: {
                    some: {
                        socket_session_id: socketSessionId,
                    },
                },
            },
            {},
            'conversation with other resources does not match',
        );

        if (conversation.closed_at) throw new HttpException('conversation is closed', HttpStatus.NOT_ACCEPTABLE);

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
            const subscriberAi = await this.subscriberService.findAiInfoBySubscriberIdWithExecption(
                subscriberId,
                'Somehow subscriber ai not connected. Please contact support',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );

            const confidenceLevel = 0.7;
            // ai response
            try {
                const aiRes: any = await this.httpService
                    .get(`https://api.wit.ai/message?q=${replyAiDto.msg}`, {
                        headers: { Authorization: `Bearer ${subscriberAi.access_token}` },
                    })
                    .toPromise();

                if (
                    aiRes.data &&
                    aiRes.data.intents &&
                    aiRes.data.intents.length &&
                    'aiRes.data.intents[0].confidence > confidenceLevel'
                ) {
                    finalIntent = await this.prisma.intent.findFirst({
                        where: {
                            tag: aiRes.data.intents[0].name,
                            subscriber_id: subscriberId,
                        },
                        include: {
                            intent_action: true,
                        },
                    });
                }
            } catch (e) {
                console.log(e.response.data);
            }
        }

        let content = null;

        if (finalIntent) {
            if (finalIntent.intent_action.type === 'static') {
                content = finalIntent.intent_action.content;
            } else if (finalIntent.intent_action.type === 'action') {
            } else if (finalIntent.intent_action.type === 'external') {
            }
        }

        if (content) {
            return this.prisma.message.create({
                data: {
                    msg: content,
                    subscriber: { connect: { id: subscriberId } },
                    conversation: { connect: { id: conversation.id } },
                },
            });
        } else {
            // get if null res
            const ai_msg: any = await this.prisma.message.create({
                data: {
                    msg: 'Sorry cant understand. Transferring chat to a available agent',
                    subscriber: { connect: { id: subscriberId } },
                    conversation: { connect: { id: conversation.id } },
                },
            });

            ai_msg.ai_resolved = false;

            return ai_msg;
        }
    }
}
