import { IsArray, ArrayNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class FacebookPageConnectionDto {
    @IsArray()
    @ArrayNotEmpty()
    chat_department_ids: string[];
}
