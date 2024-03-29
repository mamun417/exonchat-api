import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from 'src/prisma.service';
import { DataHelper } from 'src/helper/data-helper';
import { SpeechRecognitionController } from './speech.controller';
import { SpeechRecognitionService } from './speech.service';
import { IntentsService } from '../intents/intents.service';

@Module({
    imports: [HttpModule],
    controllers: [SpeechRecognitionController],
    providers: [PrismaService, DataHelper, SpeechRecognitionService, IntentsService],
})
export class SpeechRecognitionModule {}
