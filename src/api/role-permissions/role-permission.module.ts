import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { ChatAgent } from '../chat-agents/entities/chat-agent.entity';
import { ChatAgentsService } from '../chat-agents/chat-agents.service';
import { UserExtraPermission } from './entities/user_extra_permission.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Role, Permission, ChatAgent, UserExtraPermission])],
    controllers: [RoleController],
    providers: [RoleService, ChatAgentsService],
})
export class RolePermissionModule {}
