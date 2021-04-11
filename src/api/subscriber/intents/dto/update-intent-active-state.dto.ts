import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

enum intent_type_enum {
    action = 'action',
    static = 'static',
    external = 'external',
}

export class UpdateIntentActiveStateDto {
    @IsBoolean()
    active: boolean;
}
