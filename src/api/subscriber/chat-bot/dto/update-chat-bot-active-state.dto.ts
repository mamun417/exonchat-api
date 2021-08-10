import { IsBoolean } from 'class-validator';

// both chat bot & chat bot item active state
export class UpdateChatBotActiveStateDto {
    @IsBoolean()
    active: boolean;
}
