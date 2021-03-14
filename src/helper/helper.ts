import { HttpException, HttpStatus } from '@nestjs/common';

export class Helper {
    async getSingleDataWithException(callback, table = '') {
        const data = await callback();

        if (!data) {
            throw new HttpException(`Invalid identifier of ${table}`, HttpStatus.NOT_FOUND);
        }

        return data;
    }
}
