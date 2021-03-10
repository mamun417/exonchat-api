import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './create-role.dto';

export class UpdateChatAgentDto extends PartialType(CreateRoleDto) {}
