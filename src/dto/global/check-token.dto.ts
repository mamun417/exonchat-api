import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class CheckTokenDto {
    @IsNotEmpty()
    api_key: string;
}
