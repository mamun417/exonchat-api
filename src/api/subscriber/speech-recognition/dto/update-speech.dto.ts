import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

export class UpdateSpeechDto {
    @IsOptional()
    @IsString()
    intent_id: string;

    @ValidateIf((o: any) => o.intent_id)
    @IsBoolean()
    forced = false;

    @IsBoolean()
    active: boolean;
}
