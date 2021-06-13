import {
    Controller,
    Request,
    Get,
    Post,
    Param,
    Delete,
    UseGuards,
    UseInterceptors,
    UploadedFiles,
    HttpStatus,
    Res,
} from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName, imageFileFilter } from './filter/attachment.filter';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';

@Controller('attachments')
export class AttachmentsController {
    constructor(private readonly attachmentService: AttachmentsService) {}

    @UseGuards(JwtAuthGuard)
    @Post('')
    @UseInterceptors(
        FilesInterceptor('attachments', 5, {
            storage: diskStorage({
                destination: (req: any, file: any, callback: any) => {
                    const subscriberId = req.user.data.socket_session.subscriber_id;
                    const socketSessionId = req.user.data.socket_session.id;

                    // keeping attachments path. cz if other featured files to save then save to uploads/{other}
                    // after subscriber use like filter.editFileName.folder_path otherwise there will be error
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

            const updateAttachment = await this.attachmentService.attachmentUpdateStatus(attachmentId, req);

            response.push({
                src: `${process.env.CLIENT_URL}/attachments/${attachmentId}`,
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
    @Get(':id')
    async seeAttachment(@Param('id') imageId: any, @Request() req: any, @Res() res: any) {
        const attachment = await this.attachmentService.findOneAttachmentWithException(imageId, req);
        const fileExtName = extname(attachment.original_name);

        return res.sendFile(`${attachment.subscriber_id}/${attachment.folder_path}/${imageId}${fileExtName}`, {
            root: './uploads/attachments',
        });
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id/user-control')
    async revokeAttachmentControl(@Param('id') imageId: any, @Request() req: any) {
        return this.attachmentService.revokeAttachmentControl(imageId, req);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async attachmentDelete(@Param('id') imageId: any, @Request() req: any) {
        return this.attachmentService.attachmentDelete(imageId, req);
    }

    // move these to attachment module
    @UseGuards(JwtAuthGuard)
    @Get()
    async getAll(@Request() req: any) {
        return this.attachmentService.getAllAttachments(req);
    }
}
