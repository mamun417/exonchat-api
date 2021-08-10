import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

export class UpdateChatBotDto {
    @IsString()
    @IsNotEmpty()
    description: string;

    @IsOptional()
    @IsString()
    department_id: string;

    @IsBoolean()
    active: boolean;
}
