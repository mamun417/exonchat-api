import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserDto {
    @IsOptional()
    role_id: string; // check enum

    @IsNotEmpty()
    subscriber_id: string;

    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    password: string;

    @IsOptional()
    active: boolean;
}
