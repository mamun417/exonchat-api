import { IsArray, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Permission } from '../entities/permission.entity';

export class CreateRoleDto {
    @IsNotEmpty()
    slug: string;

    @IsNotEmpty()
    name: string;

    description: string;

    @IsArray()
    @MinLength(1, { each: true })
    @IsString({ each: true })
    permissions: Permission[];
}
