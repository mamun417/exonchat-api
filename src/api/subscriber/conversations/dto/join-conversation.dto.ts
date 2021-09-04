import { IsBoolean, IsOptional } from 'class-validator';

export class JoinConversationDto {
    @IsBoolean()
    @IsOptional()
    from_chat_transfer_request: boolean;
}
