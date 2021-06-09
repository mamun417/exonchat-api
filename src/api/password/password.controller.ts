import { Controller, Request, Post, Body, UseGuards } from '@nestjs/common';
import { PasswordService } from './password.service';
import { EmailPasswordDto } from './dto/email-password.dto';
import { LocalAuthGuard } from '../../auth/guards/local-auth.guard';

@Controller('password')
export class PasswordController {
    constructor(private readonly passwordService: PasswordService) {}

    @Post('email')
    email(@Request() req: any, @Body() emailPasswordDto: EmailPasswordDto) {
        return this.passwordService.email(req, emailPasswordDto);
    }

    // @UseGuards(JwtAuthGuard)
    // @Post('update/avatar')
    // async updateAvatar(@Request() req: any, @Body() updateAvatarDto: UpdateAvatarAttachmentDto) {
    //     return this.profileService.updateAvatar(req, updateAvatarDto);
    // }
}
