import {
    Controller,
    Request,
    Post,
    Body,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Get,
    Param,
    Res,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'fs';
import { extname, join } from 'path';
import { editFileName, imageFileFilter } from '../subscriber/messages/filter/attachment.filter';

@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    @UseGuards(JwtAuthGuard)
    @Post('update')
    update(@Request() req: any, @Body() updateProfileDto: UpdateProfileDto) {
        return this.profileService.update(req, updateProfileDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('update/avater')
    @UseInterceptors(
        FileInterceptor('avater', {
            storage: diskStorage({
                destination: (req: any, file: any, callback: any) => {
                    const subscriberId = req.user.data.socket_session.subscriber_id;
                    const userId = req.user.data.id;

                    const fullPath = `${join(process.cwd(), 'uploads')}/profile/${subscriberId}/${userId}`;

                    mkdirSync(fullPath, { recursive: true });

                    callback(null, fullPath);
                },
                filename: editFileName,
            }),
            fileFilter: imageFileFilter,
        }),
    )
    async updateAvater(@UploadedFile() avater: Express.Multer.File, @Request() req: any) {
        const attachmentId = avater.filename.split('.')[0];

        await this.profileService.attachmentUpdateStatus(attachmentId, req);

        return this.profileService.updateAvater(req, { attachment_id: attachmentId });
    }

    @UseGuards(JwtAuthGuard)
    @Get('attachments/:id')
    async seeAttachment(@Param('id') imageId: any, @Request() req: any, @Res() res: any) {
        const attachment = await this.profileService.findOneAttachmentWithException(imageId, req);
        const fileExtName = extname(attachment.original_name);

        return res.sendFile(`${attachment.subscriber_id}/${req.user.data.id}/${imageId}${fileExtName}`, {
            root: './uploads/profile',
        });
    }
}
