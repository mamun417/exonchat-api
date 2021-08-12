import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

export class UpdateChatBotDto {
    // if need to show before items
    @IsString()
    @IsOptional()
    content: string;

    @IsString()
    @IsOptional()
    description: string;

    // is this bot only for a department
    @IsOptional()
    @IsString()
    department_id: string;

    @IsOptional()
    @IsArray()
    chat_bot_items: Array<string>;

    @IsBoolean()
    active: boolean;
}
