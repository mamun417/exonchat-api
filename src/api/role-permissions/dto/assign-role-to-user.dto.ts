import { IsArray, IsEmpty, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Permission } from '../entities/permission.entity';
import { IsNull } from 'typeorm';

export class AssignRoleToUserDto {
    @IsNotEmpty()
    role_id: string;

    @IsNotEmpty()
    user_id: string;

    @IsOptional()
    @IsArray()
    @MinLength(1, { each: true })
    @IsString({ each: true })
    include_permissions: Permission[];

    @IsOptional()
    @IsArray()
    @MinLength(1, { each: true })
    @IsString({ each: true })
    exclude_permissions: Permission[];
}
