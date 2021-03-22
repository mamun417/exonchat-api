import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { ChatAgentsService } from '../chat-agents/chat-agents.service';

@Module({
    imports: [],
    controllers: [RoleController],
    providers: [RoleService, ChatAgentsService],
})
export class RolePermissionModule {}
