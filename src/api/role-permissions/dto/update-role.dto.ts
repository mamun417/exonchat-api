import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './create-role.dto';
import { IsNotEmpty } from 'class-validator';
import { Permission } from '../entities/permission.entity';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
    @IsNotEmpty()
    slug: string;

    @IsNotEmpty()
    name: string;

    description: string;

    permissions: Permission[];
}
