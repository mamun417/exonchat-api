import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class CreateMessageDto {
    @ValidateIf((o: any) => !o.attachments || !o.attachments.length)
    @IsString()
    @IsNotEmpty()
    msg: string;

    @IsString()
    @IsNotEmpty()
    conv_id: string;

    @IsOptional()
    @IsArray()
    attachments: Array<string>;
}
