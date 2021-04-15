import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSubscriberDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    user_limit: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    agent_limit: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    join_limit: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    msg_view_total_limit: string;
}
