import { IsEmpty, IsNotEmpty } from 'class-validator';
import { IsNull } from 'typeorm';

export class CreateRoleDto {
    @IsNotEmpty()
    slug: string;

    @IsNotEmpty()
    name: string;

    description: string;

    permissions: [];
}
