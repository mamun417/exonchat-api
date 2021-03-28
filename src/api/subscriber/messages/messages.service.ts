import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DataHelper } from 'src/helper/data-helper';
import { PrismaService } from 'src/prisma.service';
import { ConversationsService } from '../conversations/conversations.service';
import { SocketSessionsService } from '../socket-session/socket-sessions.service';
import { SubscribersService } from '../subscribers/subscribers.service';

import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessagesService {
    constructor(
        private prisma: PrismaService,
        private dataHelper: DataHelper,
        private subscriberService: SubscribersService,
        private conversationService: ConversationsService,
        private socketSessionService: SocketSessionsService,
    ) {}

    async create(createMessageDto: CreateMessageDto) {
        const subscriber = await this.subscriberService.findOneByApiKeyWithException(createMessageDto.api_key);
        const socketSession = await this.socketSessionService.findOneWithException(createMessageDto.ses_id);
        const conversation = await this.conversationService.findOneWithException(
            createMessageDto.conv_id,
            {
                subscriber_id: subscriber.id,
                conversation_sessions: {
                    some: {
                        socket_session_id: { equals: socketSession.id },
                    },
                },
            },
            'conversation with other resource does not match',
        );

        if (conversation.closed_at) throw new HttpException('conversation is closed', HttpStatus.NOT_ACCEPTABLE);

        return this.prisma.message.create({
            data: {
                msg: createMessageDto.msg,
                subscriber: { connect: { id: subscriber.id } },
                conversation: { connect: { id: conversation.id } },
                socket_session: { connect: { id: socketSession.id } },
            },
        });
    }

    // async findAll(): Promise<Message[]> {
    //     return await this.messagesRepository.find({
    //         relations: ['conversation'],
    //     });
    // }

    // async findOne(id: string): Promise<Message> {
    //     return await this.messagesRepository.findOne(id);
    // }

    // async update(id: number, updateMessageDto: UpdateMessageDto) {
    //     return `This action updates a #${id} message`;
    // }

    // async remove(id: string): Promise<void> {
    //     await this.messagesRepository.delete(id);
    // }
}
