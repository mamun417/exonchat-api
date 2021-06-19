import { HttpException, HttpService, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';

@Injectable()
export class RatingsService {
    constructor(private prisma: PrismaService, private httpService: HttpService) {}

    async create(req: any, createRatingDto: CreateRatingDto) {
        const subscriberId = req.user.data.socket_session.subscriber_id;

        return this.prisma.conversation_rating.create({
            data: {
                rating: createRatingDto.rating,
                comment: createRatingDto.comment,
                subscriber: { connect: { id: subscriberId } },
                conversation: { connect: { id: createRatingDto.conversation_id } },
            },
            include: {
                subscriber: true,
                conversation: true,
            },
        });
    }
}
