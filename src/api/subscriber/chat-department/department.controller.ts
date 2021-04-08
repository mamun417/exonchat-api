import { Controller, Request, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ChatDepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { UpdateDepartmentActiveStateDto } from './dto/update-department-active-state.dto';

@Controller('speech')
export class ChatDepartmentController {
    constructor(private readonly chatDepartmentService: ChatDepartmentService) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Request() req: any) {
        return this.chatDepartmentService.findAll(req);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req: any, @Body() createDepartmentDto: CreateDepartmentDto) {
        return this.chatDepartmentService.create(req, createDepartmentDto);
    }

    // @UseGuards(JwtAuthGuard)
    // @Post(':id')
    // update(@Param('id') id: string, @Request() req: any, @Body() updateDepartmentDto: UpdateDepartmentDto) {
    //     return this.chatDepartmentService.update(id, req, updateDepartmentDto);
    // }

    @UseGuards(JwtAuthGuard)
    @Post(':id/active-status')
    updateActiveState(
        @Param('id') id: string,
        @Request() req: any,
        @Body() updateDepartmentActiveStateDto: UpdateDepartmentActiveStateDto,
    ) {
        return this.chatDepartmentService.updateActiveState(id, req, updateDepartmentActiveStateDto);
    }
}
