import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

enum intent_type_enum {
    action = 'action',
    static = 'static',
    external = 'external',
}

export class CreateIntentDto {
    @IsString()
    @IsNotEmpty()
    tag: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsEnum(intent_type_enum)
    type: intent_type_enum;

    @IsBoolean()
    connect_with_ai = true;

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
