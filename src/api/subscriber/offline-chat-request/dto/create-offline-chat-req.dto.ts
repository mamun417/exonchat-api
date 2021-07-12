import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOfflineChatReqDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    subject: string;

    @IsString()
    @IsNotEmpty()
    message: string;

    @IsString()
    @IsOptional()
    priority: string;

    @IsString()
    @IsNotEmpty()
    chat_department_id: string;
}
