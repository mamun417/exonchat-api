import { ArrayNotEmpty, IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateDepartmentDto {
    @IsString()
    @IsNotEmpty()
    description: string;

    @IsOptional()
    @IsArray()
    // @ArrayNotEmpty()
    user_ids: Array<string>;

    @IsBoolean()
    active: boolean;
}
