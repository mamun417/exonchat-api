import { IsOptional, IsString } from 'class-validator';

export class CloseConversationDto {
    @IsString()
    @IsOptional()
    closed_reason: string;
}
