import { IsNotEmpty } from 'class-validator';

export class UpdateAvaterAttachmentDto {
    @IsNotEmpty()
    attachment_id: string;
}
