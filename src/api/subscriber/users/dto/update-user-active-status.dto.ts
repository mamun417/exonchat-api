import { IsBoolean } from 'class-validator';

export class UpdateUserActiveStateDto {
    @IsBoolean()
    active: boolean;
}
