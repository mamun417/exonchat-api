import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MessageService } from './message.service';
import { Messages } from './message.entity';
// import { CreateCatDto } from './dto/create-cat.dto'; // request
// import { Cat } from './interfaces/cat.interface'; // transform

import { v4 } from 'uuid';

@Controller('messages')
export class MessageController {
    constructor(private messagesService: MessageService) {}

    // @Post()
    // async create(@Body() createCatDto: CreateCatDto) {
    //     this.catsService.create(createCatDto);
    // }

    @Get()
    async findAll(): Promise<Messages[]> {
        const x = await this.messagesService.findAll();

        x.map((i) => {
            console.log(i);
            i.id = v4(i.id);
        });

        return x;
    }

    @Get(':id')
    findOne(@Param() params): Promise<Messages> {
        console.log(params.id);
        return this.messagesService.findOne(params.id);
    }
}
