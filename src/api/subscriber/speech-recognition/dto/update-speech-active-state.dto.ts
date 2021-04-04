import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

export class UpdateSpeechActiveStateDto {
    @IsBoolean()
    active: boolean;
}
