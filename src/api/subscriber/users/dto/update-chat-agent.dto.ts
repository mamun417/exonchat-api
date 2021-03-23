import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-chat-agent.dto';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
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
