import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { DataHelper } from 'src/helper/data-helper';
import { ChatDepartmentController } from './department.controller';
import { ChatDepartmentService } from './department.service';
import { UsersService } from '../users/users.service';

@Module({
    imports: [],
    controllers: [ChatDepartmentController],
    providers: [PrismaService, DataHelper, ChatDepartmentService, UsersService],
})
export class ChatDepartmentModule {}
