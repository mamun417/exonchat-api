import { ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDepartmentDto {
    @IsString()
    @IsNotEmpty()
    tag: string;

    @IsString()
    @IsNotEmpty()
    display_name: string;

    @IsOptional()
    @IsArray()
    @ArrayNotEmpty()
    user_ids: Array<string>;
}
