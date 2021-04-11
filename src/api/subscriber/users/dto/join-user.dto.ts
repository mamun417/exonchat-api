import { IsNotEmpty, IsOptional } from 'class-validator';

export class JoinUserDto {
    @IsNotEmpty()
    invitation_id: string;

    @IsNotEmpty()
    full_name: string;

    @IsNotEmpty()
    display_name: string;

    @IsNotEmpty()
    password: string;

    @IsNotEmpty()
    code: string;
}
