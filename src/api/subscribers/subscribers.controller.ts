import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { SubscribersService } from './subscribers.service';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';
import { Role } from 'src/authorizarion/role.enum';
import { RequireRole } from 'src/authorizarion/roles.decorator';

@Controller('subscribers')
export class SubscribersController {
    constructor(private readonly subscribersService: SubscribersService) {}

    @Post()
    create(@Body() createSubscriberDto: CreateSubscriberDto) {
        // return createSubscriberDto;
        return this.subscribersService.create(createSubscriberDto);
    }

    @RequireRole(Role.SuperAdmin)
    @Get()
    findAll() {
        return this.subscribersService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.subscribersService.findOne(id);
    }

    // @Get('chat_client/:apy_key') // will be change later
    // getChatClientApiKey(@Param('apy_key') apy_key: string) {
    //     return this.subscribersService.getChatClientByApiKey(apy_key);
    // }

    // @Put(':id')
    // update(@Param('id') id: string, @Body() updateSubscriberDto: UpdateSubscriberDto) {
    //     return this.subscribersService.update(+id, updateSubscriberDto);
    // }

    // @Delete(':id')
    // remove(@Param('id') id: string) {
    //     return this.subscribersService.remove(+id);
    // }
}
