import { IsEmail, IsNotEmpty } from 'class-validator';

export class EmailPasswordDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;
}
