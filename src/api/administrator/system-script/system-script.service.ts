import { HttpException, HttpService, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class SystemScriptService {
    constructor(private prisma: PrismaService, private httpService: HttpService) {}

    async test(req: any) {
        return 'test';
    }
}
