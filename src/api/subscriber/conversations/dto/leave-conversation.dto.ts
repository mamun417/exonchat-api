import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class LeaveConversationDto {
    @IsNotEmpty()
    api_key: string;

    @IsNotEmpty()
    ses_id: string;
}
