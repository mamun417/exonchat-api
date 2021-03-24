import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class CloseConversationDto {
    @IsNotEmpty()
    api_key: string;

    @IsNotEmpty()
    ses_id: string;
}
