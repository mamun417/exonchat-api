import { HttpException, HttpService, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

import { intent } from '@prisma/client';
import { DataHelper } from 'src/helper/data-helper';
import { UpdateUiSettingsDto } from './dto/update-ui-settings.dto';

import * as _l from 'lodash';

@Injectable()
export class SettingsService {
    constructor(private prisma: PrismaService, private dataHelper: DataHelper) {}

    async updateUISetting(req: any, updateUISettingsDto: UpdateUiSettingsDto) {
        if (!updateUISettingsDto.ui_settings.length)
            throw new HttpException(`UI Settings can not be empty`, HttpStatus.BAD_REQUEST);

        const adminUser = await this.prisma.user.findFirst({
            where: { id: req.user.data.id, role: { slug: 'admin' } },
        });

        const settings = [];

        for (const setting of updateUISettingsDto.ui_settings) {
            if (!_l.isPlainObject(setting) || !setting.name || !setting.value)
                throw new HttpException(`UI Settings update structure not good`, HttpStatus.BAD_REQUEST);

            const temp: any = await this.findOneWithException(setting.name, req);

            if (
                temp.category !== 'ui' ||
                temp.user_type === 'administrator' ||
                (!adminUser && temp.user_type === 'subscriber') ||
                (temp.subscriber_id && temp.subscriber_id !== req.user.data.subscriber_id)
            )
                throw new HttpException(
                    `You dont have permission to change some of the settings`,
                    HttpStatus.FORBIDDEN,
                );

            settings.push({
                ...setting,
                from_db: temp,
            });
        }

        for (const setting of settings) {
            const updateOrCreate: any = {};

            if (setting.user_settings_value.length) {
                updateOrCreate.update = {
                    where: { id: setting.user_settings_value[0].id },
                    data: { value: setting.value },
                };
            } else {
                updateOrCreate.create = [{ value: setting.value }];
            }

            if (setting.from_db.user_type === 'user') {
                // its dynamic but for eye not good
                // updateOrCreate[Object.keys(updateOrCreate)[0]][
                //     Object.keys(updateOrCreate)[0] === 'update' ? 'update' : 0
                // ].user_id = req.user.data.id;

                if (setting.user_settings_value.length) {
                    updateOrCreate.update.data.user_id = req.user.data.id;
                } else {
                    updateOrCreate.create[0].user_id = req.user.data.id;
                }
            }

            if (setting.from_db.user_type)
                await this.prisma.setting.update({
                    where: {
                        slug_identifier: {
                            slug: setting.name,
                            category: 'ui',
                            user_type: setting.from_db.user_type === 'user' ? 'user' : 'subscriber',
                        },
                    },
                    data: {
                        user_settings_value: {
                            ...updateOrCreate,
                        },
                    },
                });
        }

        return this.getUISettings(req);
    }

    async getUISettings(req: any) {
        return this.prisma.setting.findMany({
            where: {
                category: 'ui',
                user_type: { not: 'administrator' },
            },
            include: {
                user_settings_value: {
                    where: {
                        subscriber_id: req.user.data.subscriber_id,
                        OR: [{ user_id: null }, { user_id: req.user.data.id }],
                    },
                },
            },
        });
    }

    async findOne(slug: string, req: any) {
        return this.prisma.setting.findFirst({
            where: {
                slug: slug,
            },
            include: {
                user_settings_value: {
                    where: {
                        subscriber_id: req.user.data.subscriber_id,
                        OR: [{ user_id: null }, { user_id: req.user.data.id }],
                    },
                },
            },
        });
    }

    async findOneWithException(slug: string, req: any): Promise<intent> {
        return this.dataHelper.getSingleDataWithException(async () => await this.findOne(slug, req), 'settings');
    }
}
