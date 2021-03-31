import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMessageDto {
    @IsString()
    @IsNotEmpty()
    msg: string;

    @IsString()
    @IsNotEmpty()
    conv_id: string;
}
