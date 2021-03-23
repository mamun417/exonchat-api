import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

enum chat_type_enum {
    live_chat = 'live_chat',
    user_to_user_chat = 'user_to_user_chat',
}

export class JoinConversationDto {
    @IsNotEmpty()
    api_key: string;

    @IsNotEmpty()
    ses_id: string;

    @IsEnum(chat_type_enum)
    chat_type: chat_type_enum;
}
