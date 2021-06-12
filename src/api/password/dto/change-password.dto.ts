import { IsNotEmpty, IsNotIn, IsString } from 'class-validator';

export class ChangePasswordDto {
    @IsString()
    @IsNotEmpty()
    old_password: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
