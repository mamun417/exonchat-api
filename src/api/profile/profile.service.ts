import { user } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
    constructor(private prisma: PrismaService) {}

    async update(req: any, updateProfileDto: UpdateProfileDto) {
        return this.prisma.user.update({
            where: {
                id: req.user.data.id,
            },
            data: {
                user_meta: {
                    update: {
                        full_name: updateProfileDto.full_name,
                        display_name: updateProfileDto.display_name,
                        phone: updateProfileDto.phone,
                        address: updateProfileDto.address,
                    },
                },
            },
            include: { user_meta: true },
        });
    }
}
