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

enum initiate_by_enum {
    user = 'user', // user mean from backend
    client = 'client',
}

export class CreateConversationV2Dto {
    @IsEnum(chat_type_enum)
    chat_type: chat_type_enum;

    @IsEnum(initiate_by_enum)
    initiate_by: initiate_by_enum;

    @ValidateIf((o) => o.chat_type === 'live_chat' && o.initiate_by === 'client')
    @IsString()
    name: string;

    @ValidateIf((o) => o.chat_type === 'live_chat' && o.initiate_by === 'client')
    @IsEmail()
    email: string;

    @ValidateIf((o) => o.chat_type === 'live_chat')
    @IsString()
    department_id: string;

    @ValidateIf((o) => o.chat_type !== 'live_chat' || (o.chat_type === 'live_chat' && o.initiate_by === 'user'))
    @IsArray()
    @ArrayNotEmpty()
    session_ids: Array<string>;

    @IsOptional()
    user_info: any;
}
