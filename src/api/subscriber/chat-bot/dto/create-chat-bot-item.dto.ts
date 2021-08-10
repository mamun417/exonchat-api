import {
    ArrayNotEmpty,
    IsArray,
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    ValidateIf,
} from 'class-validator';

export class CreateChatBotItemDto {
    @IsString()
    @IsNotEmpty()
    tag: string;

    @IsString()
    @IsNotEmpty()
    display_name: string;

    @IsString()
    @IsOptional()
    description: string;

    @ValidateIf((o) => !o.intent_id || !o.chat_bot_ids)
    @IsString()
    content: string;

    @IsOptional()
    @IsString()
    intent_id: string;

    // it's for if a items resolves to another chat bot
    @IsOptional()
    @IsString()
    resolve_to_chat_bot_id: string;

    // it's for which chat bot it belongs to
    @ArrayNotEmpty()
    @IsArray()
    chat_bot_ids: Array<string>;

    @IsBoolean()
    active: boolean;
}
