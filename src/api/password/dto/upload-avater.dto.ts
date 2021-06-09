import { IsNotEmpty } from 'class-validator';

export class UploadAvatarDto {
    @IsNotEmpty()
    avatar: string;
}
