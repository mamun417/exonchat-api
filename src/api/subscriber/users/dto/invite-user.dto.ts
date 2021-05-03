import { IsBoolean, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

enum user_type_enum {
    user = 'user',
    agent = 'agent',
}

export class InviteUserDto {
    @IsNotEmpty()
    email: string;

    @IsEnum(user_type_enum)
    type: user_type_enum;

    @IsOptional()
    @IsBoolean()
    active = true;
}
