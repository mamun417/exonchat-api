import { IsArray, IsEmail, IsEmpty, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSubscriberDto {
    @IsEmail()
    email: string;

    @IsNotEmpty()
    password: string;

    @IsString()
    @IsNotEmpty()
    first_name: string;

    @IsString()
    @IsNotEmpty()
    last_name: string;

    @IsString()
    @IsNotEmpty()
    display_name: string;
}
