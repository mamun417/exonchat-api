import { Controller, Request, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { InviteUserDto } from './dto/invite-user.dto';
import { JoinUserDto } from './dto/join-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    // @Post()
    // create(@Body() createChatAgentDto: CreateChatAgentDto) {
    //     return this.chatAgentsService.create(createChatAgentDto);
    // }

    @UseGuards(JwtAuthGuard)
    @Post('invitation/invite')
    invite(@Request() req: any, @Body() inviteUserDto: InviteUserDto) {
        return this.usersService.invite(req, inviteUserDto);
    }

    @Post('invitation/join')
    join(@Body() joinUserDto: JoinUserDto) {
        return this.usersService.join(joinUserDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('invitation/:id/cancel')
    cancel(@Param('id') id: string, @Request() req: any) {
        return this.usersService.cancel(id, req);
    }

    // use permission guard later
    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Request() req: any) {
        return this.usersService.findAll(req);
    }

    @UseGuards(JwtAuthGuard)
    @Get('active')
    findActiveUsers(@Request() req: any) {
        return this.usersService.findActiveUsers(req);
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
