import { HttpException, HttpStatus } from '@nestjs/common';

export class DataHelper {
    async getSingleDataWithException(callback, resource_location = '', errMsg = '') {
        const data = await callback();

        if (!data) {
            if (!errMsg) {
                errMsg = 'resource not found';

                if (resource_location) {
                    errMsg = `${resource_location} ${errMsg}`;
                }
            }

            throw new HttpException(errMsg, HttpStatus.NOT_FOUND);
        }

        return data;
    }
}
