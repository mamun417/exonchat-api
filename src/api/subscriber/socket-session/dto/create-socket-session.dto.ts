import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSocketSessionDto {
    @IsNotEmpty()
    api_key: string;

    @IsOptional()
    @IsNotEmpty()
    user_id: string;
}
