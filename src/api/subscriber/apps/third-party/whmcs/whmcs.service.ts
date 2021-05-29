import { ValidateUserDto } from './dto/ValidateUser.dto';
import { HttpException, HttpService, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class WHMCSService {
    constructor(private prisma: PrismaService, private httpService: HttpService) {}

    async findAll(req: any) {
        return { note: 'call whmcs api for ticket get' };
    }

    async validateUser(req: any, validateUserDto: ValidateUserDto) {
        const params = {
            action: 'ValidateLogin',
            email: validateUserDto.email,
            password2: validateUserDto.password,
        };

        return await this.getResponse(params);
    }

    async findTickets(req: any, clientId: any) {
        const params = {
            action: 'GetTickets',
            clientid: clientId,
        };

        return await this.getResponse(params);
    }

    async getResponse(dynamicFields: any) {
        const params = new URLSearchParams({
            username: '3tuMBl8jtZ6xYgiZDUqfiHpFuroPu0Ch',
            password: 'mp9FzClGBjvdEUzaBz3wBg9IlIHuwSwW',
            responsetype: 'json',
            ...dynamicFields,
        });

        try {
            const res: any = await this.httpService
                .post('https://dev.exonhost.com/includes/api.php', params.toString())
                .toPromise();

            return res.data;
        } catch (e) {
            return e.response.data;
        }
    }
}
