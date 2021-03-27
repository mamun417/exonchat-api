import { HttpException, HttpStatus } from '@nestjs/common';

export class Helper {
    async getSingleDataWithException(callback, resource_location = '') {
        const data = await callback();

        if (!data) {
            throw new HttpException(`Resource Not Found!`, HttpStatus.NOT_FOUND);
        }

        return data;
    }
}
