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

        const getSpeech = await this.prisma.speech_recognition.findUnique({
            where: {
                speech_subscriber_delete: {
                    speech: createSpeechDto.speech,
                    tsid: subscriberId,
                    for_delete: false,
                },
            },
        });

        if (getSpeech) throw new HttpException(`Already Created with this speech`, HttpStatus.CONFLICT);

        let intentConnector = {};

        if (createSpeechDto.intent_id) {
            await this.intentService.findOneWithException(createSpeechDto.intent_id, req);

            intentConnector = { intent: { connect: { id: createSpeechDto.intent_id } } };

            if (!createSpeechDto.forced) {
                //sys script will handle this.
            }
        }

        return this.prisma.speech_recognition.create({
            data: {
                speech: createSpeechDto.speech,
                forced: createSpeechDto.forced,
                submit_to_ai: !createSpeechDto.forced && !!createSpeechDto.intent_id, // submit to ai if not forced & has intent id
                active: createSpeechDto.active,
                tsid: subscriberId,
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
                    intent_id: intent.id,
                };

                if (!updateSpeechDto.forced) {
                    submitToAiFieldValue = true; // it will resubmit
                    resolvedFieldValue = false; // after resubmit get updated info
                }

                // no need to check !speech.forced && updateSpeechDto.forced condition here
            }
        } else {
            if (speech.intent_id) {
                intentConnectAndDisconnect = {
                    intent: { disconnect: true }, // did not check intent_id: null for same work
                };
            }
        }

        // doesn't matter if intent id match or not
        if (speech.intent_id && !speech.forced && speech.has_in_ai && updateSpeechDto.forced) {
            removeFromAiFieldValue = true;
            resolvedFieldValue = false; // it will prevent from get ai result
        }

        return this.prisma.speech_recognition.update({
            where: { id: speech.id },
            data: {
                forced: updateSpeechDto.forced,
                active: updateSpeechDto.active,
                resolved: resolvedFieldValue,
                submit_to_ai: submitToAiFieldValue,
                remove_from_ai: removeFromAiFieldValue,
                ...intentConnectAndDisconnect,
            },
            include: {
                intent: true,
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

    async delete(id: any, req: any) {
        await this.findOneWithException(id, req);

        return this.prisma.speech_recognition.update({
            where: { id: id },
            data: {
                for_delete: true,
            },
        });
    }

    async findAll(req: any) {
        return this.prisma.speech_recognition.findMany({
            where: {
                subscriber_id: req.user.data.subscriber_id,
                for_delete: false,
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
