import { Controller, Request, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { InvitationUpdateDto } from './dto/invitation-update.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { JoinUserDto } from './dto/join-user.dto';
import { UpdateUserActiveStateDto } from './dto/update-user-active-status.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    // @Post()
    // create(@Body() createChatAgentDto: CreateChatAgentDto) {
    //     return this.chatAgentsService.create(createChatAgentDto);
    // }

    @UseGuards(JwtAuthGuard)
    @Post(':id/active-status')
    updateActiveState(@Param('id') id: string, @Request() req: any, @Body() updateUserDto: UpdateUserActiveStateDto) {
        return this.usersService.updateUserActiveState(id, req, updateUserDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('invitations')
    findAllInvitations(@Request() req: any) {
        return this.usersService.findAllInvitations(req);
    }

    @UseGuards(JwtAuthGuard)
    @Post('invitations/invite')
    invite(@Request() req: any, @Body() inviteUserDto: InviteUserDto) {
        return this.usersService.invite(req, inviteUserDto);
    }

    @Post('invitations/join')
    join(@Body() joinUserDto: JoinUserDto) {
        return this.usersService.join(joinUserDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('invitations/:id/cancel')
    cancel(@Param('id') id: string, @Request() req: any) {
        return this.usersService.cancel(id, req);
    }

    @Get('invitations/:id')
    async findOneInvitation(@Param('id') id: string) {
        const inv: any = await this.usersService.findOneInvitation(id);

        if (inv) {
            delete inv.code;
            delete inv.subscriber_id;
            delete inv.active;
        }

        return inv;
    }

    @UseGuards(JwtAuthGuard)
    @Post('invitations/:id/update')
    updateInvitation(@Param('id') id: string, @Request() req: any, @Body() updateInvitationDto: InvitationUpdateDto) {
        return this.usersService.updateInvitation(id, req, updateInvitationDto);
    }

    // use permission guard later
    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Request() req: any) {
        return this.usersService.findAll(req);
    }

    @UseGuards(JwtAuthGuard)
    @Get('invitations')
    findAllInvitation(@Request() req: any) {
        return this.usersService.findAllInvitation(req);
    }

    @UseGuards(JwtAuthGuard)
    @Get('active')
    findActiveUsers(@Request() req: any) {
        return this.usersService.findActiveUsers(req);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('invitations/:id')
    delete(@Param('id') id: string, @Request() req: any) {
        return this.usersService.deleteInvitation(id, req);
    }

    // @Get(':id')
    // findOne(@Param('id') id: string) {
    //     return this.chatAgentsService.findOne(id);
    // }
    // @Put(':id')
    // update(@Param('id') id: string, @Body() updateChatAgentDto: UpdateChatAgentDto) {
    //     return this.chatAgentsService.update(id, updateChatAgentDto);
    // }
    // @Delete(':id')
    // remove(@Param('id') id: string) {
    //     return this.chatAgentsService.remove(+id);
    // }
    // @Get(':id/permissions')
    // getUserPermissions(@Param('id') id: string) {
    //     return this.chatAgentsService.getUserPermissions(id);
    // }
}
