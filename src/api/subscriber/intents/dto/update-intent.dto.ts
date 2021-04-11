import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

enum intent_type_enum {
    action = 'action',
    static = 'static',
    external = 'external',
}

export class UpdateIntentDto {
    @IsString()
    @IsNotEmpty()
    description: string;

    @IsEnum(intent_type_enum)
    type: intent_type_enum;

    @ValidateIf((o: any) => o.type === 'static')
    @IsString()
    content: string;

    @ValidateIf((o: any) => o.type === 'action')
    @IsString()
    action_name: string;

    @ValidateIf((o: any) => o.type === 'external')
    @IsUrl()
    external_path: string;

    @IsBoolean()
    active: boolean;
}
