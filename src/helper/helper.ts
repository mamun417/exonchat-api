import { HttpException, HttpStatus } from '@nestjs/common';

export class Helper {
    async getSingleDataWithException(callback) {
        const data = await callback();

        if (!data) {
            throw new HttpException('Data not found', HttpStatus.NOT_FOUND);
        }

        return data;
    }
}
