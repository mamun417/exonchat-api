import { IsNotEmpty, IsString } from 'class-validator';

export class WhmcsLoginDto {
    @IsString()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
