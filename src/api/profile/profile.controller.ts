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
import { UpdateAvatarAttachmentDto } from './dto/update-avatar-attachment.dto';

@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    @UseGuards(JwtAuthGuard)
    @Post('update')
    update(@Request() req: any, @Body() updateProfileDto: UpdateProfileDto) {
        return this.profileService.update(req, updateProfileDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('update/avatar')
    async updateAvatar(@Request() req: any, @Body() updateAvatarDto: UpdateAvatarAttachmentDto) {
        return this.profileService.updateAvatar(req, updateAvatarDto);
    }
}
