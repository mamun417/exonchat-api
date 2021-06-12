import { Controller, Request, Post, Body, UseGuards } from '@nestjs/common';
import { PasswordService } from './password.service';
import { EmailPasswordDto } from './dto/email-password.dto';
import { LocalAuthGuard } from '../../auth/guards/local-auth.guard';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CheckPasswordDto } from './dto/check-password.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('password')
export class PasswordController {
    constructor(private readonly passwordService: PasswordService) {}

    @Post('email')
    email(@Request() req: any, @Body() emailPasswordDto: EmailPasswordDto) {
        return this.passwordService.email(req, emailPasswordDto);
    }

    @Post('reset')
    reset(@Request() req: any, @Body() resetPasswordDto: ResetPasswordDto) {
        return this.passwordService.reset(req, resetPasswordDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('check')
    check(@Request() req: any, @Body() checkPasswordDto: CheckPasswordDto) {
        return this.passwordService.check(req, checkPasswordDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('change')
    change(@Request() req: any, @Body() changePasswordDto: ChangePasswordDto) {
        return this.passwordService.change(req, changePasswordDto);
    }

    // @UseGuards(JwtAuthGuard)
    // @Post('update/avatar')
    // async updateAvatar(@Request() req: any, @Body() updateAvatarDto: UpdateAvatarAttachmentDto) {
    //     return this.profileService.updateAvatar(req, updateAvatarDto);
    // }
}
