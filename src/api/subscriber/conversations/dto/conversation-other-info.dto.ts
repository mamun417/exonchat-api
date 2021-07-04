import { IsNotEmpty, IsString } from 'class-validator';

export class ConversationOtherInfoDto {
    @IsString()
    @IsNotEmpty()
    notify_to_value: string;

    // add other if needed
}
