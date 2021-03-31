import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

enum chat_type_enum {
    live_chat = 'live_chat',
    user_to_user_chat = 'user_to_user_chat',
}

export class CreateConversationDto {
    @IsEnum(chat_type_enum)
    chat_type: chat_type_enum;
}
