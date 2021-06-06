import {
    Controller,
    Request,
    Get,
    Post,
    Body,
    Put,
    Param,
    Delete,
    UseGuards,
    UseInterceptors,
    UploadedFiles,
    HttpStatus,
    Res,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req: any, @Body() createMessageDto: CreateMessageDto) {
        return this.messagesService.create(req, createMessageDto);
    }
}
