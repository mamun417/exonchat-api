import { PartialType } from '@nestjs/mapped-types';
import { CreateChatAgentDto } from './create-chat-agent.dto';

export class UpdateChatAgentDto extends PartialType(CreateChatAgentDto) {}
