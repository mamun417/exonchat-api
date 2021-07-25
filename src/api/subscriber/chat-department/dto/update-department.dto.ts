import { ArrayNotEmpty, IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateDepartmentDto {
    @IsOptional()
    @IsArray()
    // @ArrayNotEmpty()
    user_ids: Array<string>;
}
