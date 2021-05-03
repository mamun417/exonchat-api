import { IsBoolean, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

enum user_type_enum {
    user = 'user',
    agent = 'agent',
}

export class InvitationUpdateDto {
    @IsEnum(user_type_enum)
    type: user_type_enum;

    @IsBoolean()
    active = true;
}
