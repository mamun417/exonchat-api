import { HttpException, HttpService, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class WHMCSService {
    constructor(private prisma: PrismaService, private httpService: HttpService) {}

    async findAll(req: any) {
        return { note: 'call whmcs api for ticket get' };
    }
}
