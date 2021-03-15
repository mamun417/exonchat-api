import { Module } from '@nestjs/common';
import { ChatAgentsService } from './chat-agents.service';
import { ChatAgentsController } from './chat-agents.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatAgent } from './entities/chat-agent.entity';
import { UserExtraPermission } from '../role-permissions/entities/user_extra_permission.entity';
import { Permission } from '../role-permissions/entities/permission.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ChatAgent, UserExtraPermission, Permission])],
    controllers: [ChatAgentsController],
    providers: [ChatAgentsService],
})
export class ChatAgentsModule {}
