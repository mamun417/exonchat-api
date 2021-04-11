import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

export class UpdateDepartmentActiveStateDto {
    @IsBoolean()
    active: boolean;
}
