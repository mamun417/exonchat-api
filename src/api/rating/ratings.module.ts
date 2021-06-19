import { HttpModule, Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';

@Module({
    imports: [HttpModule],
    controllers: [RatingsController],
    providers: [PrismaService, RatingsService],
})
export class RatingModule {}
