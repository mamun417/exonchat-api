import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MessageService } from './message.service';
import { Messages } from './message.entity';
// import { CreateCatDto } from './dto/create-cat.dto'; // request
// import { Cat } from './interfaces/cat.interface'; // transform

@Controller('messages')
export class MessageController {
    constructor(private messagesService: MessageService) {}

    // @Post()
    // async create(@Body() createCatDto: CreateCatDto) {
    //     this.catsService.create(createCatDto);
    // }

    @Get()
    async findAll(): Promise<Messages[]> {
        return this.messagesService.findAll();
    }

    @Get(':id')
    findOne(@Param() params): Promise<Messages> {
        console.log(params.id);
        return this.messagesService.findOne(params.id);
    }
}
