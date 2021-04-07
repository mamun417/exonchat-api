import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

export class CreateTemplateDto {
    @IsString()
    @IsNotEmpty()
    tag: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @ValidateIf((o) => !o.intent_id)
    @IsString()
    content: string;

    @IsOptional()
    @IsString()
    intent_id: string;

    @IsBoolean()
    active: boolean;
}
