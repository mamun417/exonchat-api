import {
    ArrayNotEmpty,
    IsArray,
    IsEmail,
    IsEnum,
    IsJSON,
    IsOptional,
    isString,
    IsString,
    ValidateIf,
} from 'class-validator';

enum chat_type_enum {
    live_chat = 'live_chat',
    user_to_user_chat = 'user_to_user_chat',
    group_chat = 'group_chat',
}

export class CreateConversationDto {
    @IsEnum(chat_type_enum)
    chat_type: chat_type_enum;

    @ValidateIf((o) => o.chat_type === 'live_chat')
    @IsString()
    name: string;

    @ValidateIf((o) => o.chat_type === 'live_chat')
    @IsEmail()
    email: string;

    @ValidateIf((o) => o.chat_type === 'live_chat')
    @IsString()
    department: string;

    @ValidateIf((o) => o.chat_type !== 'live_chat')
    @IsArray()
    @ArrayNotEmpty()
    ses_ids: Array<string>;

    @IsOptional()
    user_info: string;
}
