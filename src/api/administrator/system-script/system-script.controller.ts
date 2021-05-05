import { Controller, Request, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { SystemScriptService } from './system-script.service';

@Controller('administrator/system-script')
export class SystemScriptController {
    constructor(private readonly SystemScriptService: SystemScriptService) {}

    // add administratorjwt which will validate all administrator users along with script
    // add apis which are needed by system script
    @Post('')
    create(@Request() req: any) {
        return this.SystemScriptService.test(req);
    }
}
