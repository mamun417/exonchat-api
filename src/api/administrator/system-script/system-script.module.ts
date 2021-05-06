import { HttpModule, Module } from '@nestjs/common';
import { SystemScriptController } from './system-script.controller';
import { PrismaService } from 'src/prisma.service';
import { DataHelper } from 'src/helper/data-helper';
import { SystemScriptService } from './system-script.service';

@Module({
    imports: [HttpModule],
    controllers: [SystemScriptController],
    providers: [PrismaService, DataHelper],
})
export class SystemScriptModule {}
