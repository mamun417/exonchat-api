import { PartialType } from '@nestjs/mapped-types';
import { CreateChatAgentDto } from './create-chat-agent.dto';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateChatAgentDto extends PartialType(CreateChatAgentDto) {
    @IsOptional()
    role_id: string; // check enum

    @IsNotEmpty()
    subscriber_id: string;

    @IsNotEmpty()
    email: string;

    @IsOptional()
    password: string;

    @IsOptional()
    active: boolean;
}
