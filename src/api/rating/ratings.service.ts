import { HttpException, HttpService, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { ConversationsService } from '../subscriber/conversations/conversations.service';
import { EventsGateway } from '../../events/events.gateway';

@Injectable()
export class RatingsService {
    constructor(
        private prisma: PrismaService,
        private conversationService: ConversationsService,
        private ws: EventsGateway,
    ) {}

    async create(req: any, createRatingDto: CreateRatingDto) {
        const subscriberId = req.user.data.socket_session.subscriber_id;

        await this.conversationService.findOneWithException(createRatingDto.conversation_id);

        const conversationsRating = await this.prisma.conversation_rating.findMany({
            where: {
                conversation_id: createRatingDto.conversation_id,
            },
        });

        if (conversationsRating.length) {
            throw new HttpException('Conversation already rated', HttpStatus.CONFLICT);
        }

        const createdRating = await this.prisma.conversation_rating.create({
            data: {
                rating: createRatingDto.rating,
                comment: createRatingDto.comment,
                subscriber: { connect: { id: subscriberId } },
                conversation: { connect: { id: createRatingDto.conversation_id } },
            },
        });

        this.ws.sendToAllUsers({ ses_user: req.user.data }, false, 'ec_conversation_rated_from_client', createdRating);

        return createdRating;
    }
}
