import { IsOptional, IsString } from 'class-validator';

export class JoinConversationDto {
    @IsString()
    @IsOptional()
    from_chat_transfer_request: boolean;
}
