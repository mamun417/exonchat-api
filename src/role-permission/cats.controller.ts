import { CreateMessageDto } from '../api/messages/dto/create-message.dto';
import { Body, Controller, Post } from '@nestjs/common';
import { Roles } from './roles.decorator';
import { Role } from './role.enum';

@Controller('cats')
export class CatsController {
    @Post()
    @Roles(Role.Admin)
    create(@Body() createMessageDto: CreateMessageDto) {
        // create cats
    }
}
