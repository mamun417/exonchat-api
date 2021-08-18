import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from 'src/prisma.service';
import { DataHelper } from 'src/helper/data-helper';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
    imports: [HttpModule],
    controllers: [SettingsController],
    providers: [PrismaService, DataHelper, SettingsService],
})
export class SettingsModule {}
