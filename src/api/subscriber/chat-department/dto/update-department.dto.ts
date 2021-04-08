import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

export class UpdateDepartmentDto {
    @IsString()
    @IsNotEmpty()
    description: string;

    @IsBoolean()
    active: boolean;
}
