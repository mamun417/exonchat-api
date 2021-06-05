import { IsEnum } from 'class-validator';

enum convert_to_enum {
    user = 'user',
    agent = 'agent',
}

export class ConvertUserTypeDto {
    @IsEnum(convert_to_enum)
    convert_to: convert_to_enum;
}
