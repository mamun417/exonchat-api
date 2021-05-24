import { HttpException, HttpStatus } from '@nestjs/common';
import * as _l from 'lodash';

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

    paginationAndFilter(validFields: any = [], query: any = {}) {
        // valid fields [p, pp, col_name direct resolves to AND Equal {name: col_name, type: 'string to type', query_type:'default'}], default is whole string match
        // relation filter not supported yet
        const finalObj = { pagination: {}, where: {} };

        //check any of one has for manage pagination
        if (
            (validFields.includes('p') || validFields.includes('pp')) &&
            (query.hasOwnProperty('p') || query.hasOwnProperty('pp'))
        ) {
            const page = query.hasOwnProperty('p') ? parseInt(query.p) : 1;
            const perPage = query.hasOwnProperty('pp') ? parseInt(query.pp) : 10;

            finalObj.pagination = {
                skip: page * perPage - perPage,
                take: perPage,
            };
        }

        _l.without(validFields, 'p', 'pp').forEach((field: any) => {
            console.log(field);

            // now only supports filter by actual col name
            // default is now only AND for all.
            // only boolean support
            if (_l.isPlainObject(field)) {
                if (Object.keys(query).includes(field.name)) {
                    if (field.type === 'boolean') {
                        finalObj.where[field.name] = query[field.name].toLowerCase() === 'true' ? true : false;
                    } else if (field.type === 'contains' && query[field.name]) {
                        finalObj.where[field.name] = { contains: query[field.name], mode: 'insensitive' };
                    }
                }
            }

            // if first condition ok this condition wont work
            if (Object.keys(query).includes(field)) {
                finalObj.where[field] = query[field];
            }
        });

        return finalObj;
    }
}
