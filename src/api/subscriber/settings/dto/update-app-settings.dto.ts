import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

export class UpdateAppSettingsDto {
    @IsArray()
    app_settings: any;
}
