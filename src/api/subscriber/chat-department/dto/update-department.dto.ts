import { ArrayNotEmpty, IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateDepartmentDto {
    @IsString()
    @IsNotEmpty()
    tag: string;

    @IsString()
    @IsNotEmpty()
    display_name: string;

    @IsOptional()
    @IsArray()
    // @ArrayNotEmpty()
    user_ids: Array<string>;
}
