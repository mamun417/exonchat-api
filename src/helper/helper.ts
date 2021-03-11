import { HttpException, HttpStatus } from '@nestjs/common';

export class Helper {
    async getSingleDataWithException(callback) {
        const data = await callback();

        if (!data) {
            throw new HttpException('Invalid identifier', HttpStatus.NOT_FOUND);
        }

        return data;
    }
}
