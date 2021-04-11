import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

export class CreateSpeechDto {
    @IsString()
    @IsNotEmpty()
    speech: string;

    @IsOptional()
    @IsString()
    intent_id: string;

    @ValidateIf((o: any) => o.intent_id)
    @IsBoolean()
    forced_intent = false; // if forced then it wont send to ai

    @IsBoolean()
    active: boolean;
}
