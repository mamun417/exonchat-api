import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSocketSessionDto {
    @IsNotEmpty()
    api_key: string;

    @IsOptional()
    @IsNotEmpty()
    agent_id: string;
}
