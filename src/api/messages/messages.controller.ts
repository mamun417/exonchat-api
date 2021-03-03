import {
    Controller,
    Get,
    Post,
    Body,
    Put,
    Param,
    Delete,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Message } from './entities/message.entity';

@Controller('messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) {}

    @Post()
    create(@Body() createMessageDto: CreateMessageDto) {
        return this.messagesService.create(createMessageDto);
    }

    @Get()
    async findAll(): Promise<Message[]> {
        return await this.messagesService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<Message> {
        return await this.messagesService.findOne(id);
    }

    @Put(':id')
    update(
        @Param('id') id: string,
        @Body() updateMessageDto: UpdateMessageDto,
    ) {
        return this.messagesService.update(+id, updateMessageDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.messagesService.remove(id);
    }
}
