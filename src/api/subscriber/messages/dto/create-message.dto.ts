import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
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
