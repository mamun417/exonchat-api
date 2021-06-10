import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    token: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
