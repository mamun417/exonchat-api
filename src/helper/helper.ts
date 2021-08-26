import { HttpException, HttpStatus } from '@nestjs/common';
import * as _ from 'lodash';

export class Helper {
    async getSingleDataWithException(callback, resource_location = '') {
        const data = await callback();

        if (!data) {
            throw new HttpException(`Resource Not Found!`, HttpStatus.NOT_FOUND);
        }

        return data;
    }

    async getToken() {
        return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    }

    // make errors response with key and message
    makeErrorMessages(messages: any) {
        if (_.isArray(messages)) {
            const errorMessages: any = {};

            messages.forEach((message: string) => {
                const msgKey = message.split(' ')[0];

                errorMessages[msgKey] = message;
            });

            return errorMessages;
        }
    }
}
