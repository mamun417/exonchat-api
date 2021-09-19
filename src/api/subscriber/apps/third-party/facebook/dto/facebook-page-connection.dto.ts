import { IsString, IsNotEmpty } from 'class-validator';

export class FacebookPageConnectionDto {
    @IsString()
    @IsNotEmpty()
    chat_department_id: string;
}
