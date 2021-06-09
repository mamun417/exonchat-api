import { IsNotEmpty } from 'class-validator';

export class UpdateAvatarAttachmentDto {
    @IsNotEmpty()
    attachment_id: string;
}
