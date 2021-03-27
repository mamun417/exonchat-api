import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './create-role.dto';
import { IsArray, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
    @IsNotEmpty()
    slug: string;

    @IsNotEmpty()
    name: string;

    description: string;
}
