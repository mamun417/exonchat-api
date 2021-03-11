import { IsEmpty, IsNotEmpty } from 'class-validator';
import { IsNull } from 'typeorm';
import { Permission } from '../entities/permission.entity';

export class CreateRoleDto {
    @IsNotEmpty()
    slug: string;

    @IsNotEmpty()
    name: string;

    description: string;

    permissions: Permission[];
}
