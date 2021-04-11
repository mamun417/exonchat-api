import { IsNotEmpty, IsString } from 'class-validator';

export class ReplyAiDto {
    @IsString()
    @IsNotEmpty()
    msg: string;
}
