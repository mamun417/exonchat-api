import { Body, Controller, Request, Delete, Get, Ip, Param, Post, Put, UseGuards } from '@nestjs/common';
import { SocketSessionsService } from './socket-sessions.service';
import { CreateSocketSessionDto } from './dto/create-socket-session.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
@Controller('socket-sessions')
export class SocketSessionsController {
    constructor(private readonly socketSessionsService: SocketSessionsService) {}

    @Post()
    async create(@Body() createSocketSessionDto: CreateSocketSessionDto, @Ip() ip: any) {
        return this.socketSessionsService.createSocketSession(createSocketSessionDto, ip);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req: any) {
        return this.socketSessionsService.findOneWithException(id, req);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/client-conversation')
    async findOneClientConv(@Param('id') id: string, @Request() req: any) {
        return this.socketSessionsService.findOneClientConv(id, req);
    }
    // @Post('subscriber/:api_key')
    // async create(@Param('api_key') api_key: string, @Body() createChatClientDto: CreateChatClientDto) {
    //     return this.chatClientsService.create(api_key, createChatClientDto);
    // }
    // @Get()
    // async findAll(): Promise<ChatClient[]> {
    //     return await this.chatClientsService.findAll();
    // }
    // @Get('subscriber/:api_key')
    // async getChatClientsByApiKey(@Param('api_key') api_key: string): Promise<ChatClient[]> {
    //     return await this.chatClientsService.getChatClientsByApiKey(api_key);
    // }
    // @Put(':id')
    // update(@Param('id') id: string, @Body() updateChatClientDto: UpdateChatClientDto) {
    //     return this.chatClientsService.update(+id, updateChatClientDto);
    // }
    // @Delete(':id')
    // remove(@Param('id') id: string) {
    //     return this.chatClientsService.remove(+id);
    // }
}
