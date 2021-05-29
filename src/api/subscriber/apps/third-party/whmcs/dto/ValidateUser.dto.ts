import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class ValidateUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
