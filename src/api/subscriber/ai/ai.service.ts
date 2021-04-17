import { HttpException, HttpService, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ConversationsService } from '../conversations/conversations.service';

import { ReplyAiDto } from './dto/reply-ai.dto';

@Injectable()
export class AiService {
    constructor(
        private prisma: PrismaService,
        private conversationService: ConversationsService,
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
            'conversation with other resource does not match',
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
            // ai response
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
