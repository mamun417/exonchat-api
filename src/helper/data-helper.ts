import { HttpException, HttpStatus } from '@nestjs/common';

export class DataHelper {
    async getSingleDataWithException(
        callback: any,
        resource_location = '',
        errMsg = '',
        httpStatus: any = HttpStatus.NOT_FOUND,
    ) {
        const data = await callback();

        if (!data) {
            if (!errMsg) {
                errMsg = 'resource not found';

                if (resource_location) {
                    errMsg = `${resource_location} ${errMsg}`;
                }
            }

            throw new HttpException(errMsg, httpStatus);
        }

        return data;
    }
}
