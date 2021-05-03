import { HttpException, HttpService, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

import { speech_recognition } from '@prisma/client';
import { DataHelper } from 'src/helper/data-helper';

import { CreateSpeechDto } from './dto/create-speech.dto';
import { UpdateSpeechDto } from './dto/update-speech.dto';
import { UpdateSpeechActiveStateDto } from './dto/update-speech-active-state.dto';
import { IntentsService } from '../intents/intents.service';

@Injectable()
export class SpeechRecognitionService {
    constructor(
        private prisma: PrismaService,
        private dataHelper: DataHelper,
        private intentService: IntentsService,
        private httpService: HttpService,
    ) {}

    async create(req: any, createSpeechDto: CreateSpeechDto) {
        const subscriberId = req.user.data.subscriber_id;

        const getSpeech = await this.prisma.speech_recognition.findFirst({
            where: {
                speech: createSpeechDto.speech,
                subscriber_id: subscriberId,
            },
        });

        if (getSpeech) throw new HttpException(`Already Created with this speech`, HttpStatus.CONFLICT);

        let intentConnector = {};

        if (createSpeechDto.intent_id) {
            const intent = await this.intentService.findOneWithException(createSpeechDto.intent_id, req);

            intentConnector = { intent: { connect: { id: intent.id } } };

            if (!createSpeechDto.forced_intent) {
                //sys script will handle this.
            }
        }

        return this.prisma.speech_recognition.create({
            data: {
                speech: createSpeechDto.speech,
                forced_intent: createSpeechDto.forced_intent,
                submit_to_ai: !createSpeechDto.forced_intent && !!createSpeechDto.intent_id, // submit to ai if not forced & has intent id
                active: createSpeechDto.active,
                subscriber: { connect: { id: subscriberId } },
                ...intentConnector,
            },
        });
    }

    //need test
    async update(id: any, req: any, updateSpeechDto: UpdateSpeechDto) {
        const speech = await this.findOneWithException(id, req);

        // get last values
        let resolvedFieldValue: any = speech.resolved;
        let submitToAiFieldValue: any = speech.submit_to_ai;
        let removeFromAiFieldValue: any = speech.remove_from_ai;

        let intentConnectAndDisconnect = {};

        // very difficult conditions. need test
        if (updateSpeechDto.intent_id) {
            const intent = await this.intentService.findOneWithException(updateSpeechDto.intent_id, req);

            if (updateSpeechDto.intent_id !== speech.intent_id) {
                intentConnectAndDisconnect = {
                    intent: { connect: { id: intent.id }, disconnect: { id: speech.intent_id } }, // test if null disconnects ok
                };

                if (!updateSpeechDto.forced_intent) {
                    submitToAiFieldValue = true; // it will resubmit
                    resolvedFieldValue = false; // after resubmit get updated info
                }

                // no need to check !speech.forced_intent && updateSpeechDto.forced_intent condition here
            }
        } else {
            if (speech.intent_id) {
                intentConnectAndDisconnect = {
                    intent: { disconnect: { id: speech.intent_id } },
                };
            }
        }

        // doesn't matter if intent id match or not
        if (speech.intent_id && !speech.forced_intent && speech.has_in_ai && updateSpeechDto.forced_intent) {
            removeFromAiFieldValue = true;
            resolvedFieldValue = false; // it will prevent from get ai result
        }

        return this.prisma.speech_recognition.update({
            where: { id: speech.id },
            data: {
                forced_intent: updateSpeechDto.forced_intent,
                active: updateSpeechDto.active,
                resolved: resolvedFieldValue,
                submit_to_ai: submitToAiFieldValue,
                remove_from_ai: removeFromAiFieldValue,
                ...intentConnectAndDisconnect,
            },
        });
    }

    async updateActiveState(id: any, req: any, updateSpeechActiveStateDto: UpdateSpeechActiveStateDto) {
        await this.findOneWithException(id, req);

        return this.prisma.speech_recognition.update({
            where: {
                id: id,
            },
            data: {
                active: updateSpeechActiveStateDto.active,
            },
        });
    }

    async findAll(req: any) {
        return this.prisma.speech_recognition.findMany({
            where: {
                subscriber_id: req.user.data.subscriber_id,
            },
            orderBy: {
                created_at: 'desc',
            },
            include: {
                intent: true,
            },
        });
    }

    async findOne(id: string, req: any): Promise<speech_recognition> {
        return this.prisma.speech_recognition.findFirst({
            where: {
                id: id,
                subscriber_id: req.user.data.subscriber_id,
            },
        });
    }

    async findOneWithException(id: string, req: any): Promise<speech_recognition> {
        return this.dataHelper.getSingleDataWithException(
            async () => await this.findOne(id, req),
            'speech_recognition',
        );
    }
}
