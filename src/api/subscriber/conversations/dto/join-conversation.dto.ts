import { IsNotEmpty } from 'class-validator';

export class JoinConversationDto {
    @IsNotEmpty()
    api_key: string;

    @IsNotEmpty()
    ses_id: string;
}
