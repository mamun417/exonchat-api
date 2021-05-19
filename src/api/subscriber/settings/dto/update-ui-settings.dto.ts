import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

export class UpdateUiSettingsDto {
    @IsArray()
    ui_settings: any;
}
