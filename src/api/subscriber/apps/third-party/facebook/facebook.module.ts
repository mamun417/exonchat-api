import { Module } from '@nestjs/common';
import { FacebookController } from './facebook.controller';
import { FacebookService } from './facebook.service';
import { PrismaService } from '../../../../../prisma.service';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [HttpModule],
    controllers: [FacebookController],
    providers: [PrismaService, FacebookService],
})
export class FacebookModule {}
