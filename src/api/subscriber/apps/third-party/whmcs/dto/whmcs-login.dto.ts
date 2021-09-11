import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class WhmcsLoginDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
