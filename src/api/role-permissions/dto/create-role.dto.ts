import { IsArray, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateRoleDto {
    @IsNotEmpty()
    slug: string;

    @IsNotEmpty()
    name: string;

    description: string;
}
