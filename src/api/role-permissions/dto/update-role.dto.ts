import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './create-role.dto';
import { IsArray, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Permission } from '../entities/permission.entity';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
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
