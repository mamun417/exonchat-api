import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateChatClientDto {
    @IsNotEmpty()
    host_log: string;

    @IsNotEmpty()
    subscriber_id: string;
}
