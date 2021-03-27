import { HttpException, HttpStatus } from '@nestjs/common';

export class DataHelper {
    async getSingleDataWithException(callback, resource_location = '') {
        const data = await callback();

        if (!data) {
            let errMsg = 'resource not found';

            if (resource_location) {
                errMsg = `${resource_location} resource not found`;
            }

            throw new HttpException(errMsg, HttpStatus.NOT_FOUND);
        }

        return data;
    }
}
