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
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName, imageFileFilter } from './filter/attachment.filter';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';

@Controller('messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req: any, @Body() createMessageDto: CreateMessageDto) {
        return this.messagesService.create(req, createMessageDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('attachments')
    @UseInterceptors(
        FilesInterceptor('attachments', 5, {
            storage: diskStorage({
                destination: (req: any, file: any, callback: any) => {
                    const subscriberId = req.user.data.socket_session.subscriber_id;
                    const socketSessionId = req.user.data.socket_session.id;

                    const fullPath = `${join(process.cwd(), 'uploads')}/attachments/${subscriberId}/${socketSessionId}`;

                    mkdirSync(fullPath, { recursive: true });

                    callback(null, fullPath);
                },
                filename: editFileName,
            }),
            fileFilter: imageFileFilter,
        }),
    )
    async createAttachments(@Request() req: any, @UploadedFiles() attachments: any) {
        const subscriberId = req.user.data.socket_session.subscriber_id;
        const socketSessionId = req.user.data.socket_session.id;

        const response = [];

        for (const attachment of attachments) {
            const attachmentId = attachment.filename.split('.')[0];
            const fileExtName = extname(attachment.filename);

            const updateAttachment = await this.messagesService.attachmentUpdateStatus(attachmentId, req);

            response.push({
                src: `http://localhost:3000/messages/attachments/${attachmentId}`,
                attachment_info: updateAttachment,
                original_name: attachment.originalname,
            });
        }

        return {
            status: HttpStatus.OK,
            message: 'Images uploaded successfully!',
            data: response,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get('attachments/:id')
    async seeAttachment(@Param('id') imageId: any, @Request() req: any, @Res() res: any) {
        const attachment = await this.messagesService.findOneAttachmentWithException(imageId, req);
        const fileExtName = extname(attachment.original_name);

        return res.sendFile(`${attachment.subscriber_id}/${attachment.socket_session_id}/${imageId}${fileExtName}`, {
            root: './uploads/attachments',
        });
    }

    @UseGuards(JwtAuthGuard)
    @Delete('attachments/:id/user-control')
    async revokeAttachmentControl(@Param('id') imageId: any, @Request() req: any) {
        return this.messagesService.revokeAttachmentControl(imageId, req);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('attachments/:id')
    async attachmentDelete(@Param('id') imageId: any, @Request() req: any) {
        return this.messagesService.attachmentDelete(imageId, req);
    }

    // move these to attachment module
    @UseGuards(JwtAuthGuard)
    @Get('attachments')
    async getAll(@Request() req: any) {
        return this.messagesService.getAllAttachments(req);
    }
}
