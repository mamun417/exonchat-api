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
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    @UseInterceptors(FilesInterceptor('attachments'))
    create(
        @Request() req: any,
        @UploadedFiles() attachments: Express.Multer.File,
        @Body() createMessageDto: CreateMessageDto,
    ) {
        return this.messagesService.create(req, attachments, createMessageDto);
    }
}
