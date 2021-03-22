import { IsArray, IsEmpty, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class AssignRoleToUserDto {
    @IsNotEmpty()
    role_id: string;

    @IsNotEmpty()
    user_id: string;
}
