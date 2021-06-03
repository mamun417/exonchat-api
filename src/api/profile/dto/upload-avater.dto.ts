import { IsNotEmpty } from 'class-validator';

export class UploadAvatereDto {
    @IsNotEmpty()
    avater: string;
}
