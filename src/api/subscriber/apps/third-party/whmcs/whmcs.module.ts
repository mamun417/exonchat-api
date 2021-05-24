import { HttpModule, Module } from '@nestjs/common';
import { WHMCSController } from './whmcs.controller';
import { PrismaService } from 'src/prisma.service';
import { DataHelper } from 'src/helper/data-helper';
import { WHMCSService } from './whmcs.service';

@Module({
    imports: [HttpModule],
    controllers: [WHMCSController],
    providers: [PrismaService, DataHelper, WHMCSService],
})
export class WHMCSModule {}
