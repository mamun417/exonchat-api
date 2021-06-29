import { IsArray } from 'class-validator';

export class UpdateChatSettingsDto {
    @IsArray()
    chat_settings: any;
}
