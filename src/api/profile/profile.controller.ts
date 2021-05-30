import { Controller, Request, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    @UseGuards(JwtAuthGuard)
    @Post('update')
    update(@Request() req: any, @Body() updateProfileDto: UpdateProfileDto) {
        return this.profileService.update(req, updateProfileDto);
    }
}
