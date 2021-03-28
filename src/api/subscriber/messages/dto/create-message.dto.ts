import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMessageDto {
    @IsString()
    @IsNotEmpty()
    msg: string;

    @IsString()
    @IsNotEmpty()
    api_key: string;

    @IsString()
    @IsNotEmpty()
    conv_id: string;

    @IsString()
    @IsNotEmpty()
    ses_id: string;
}
