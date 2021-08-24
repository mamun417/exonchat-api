import { IsNotEmpty, IsOptional, ValidateIf } from "class-validator";

export class CreateSocketSessionDto {
    @IsNotEmpty()
    api_key: string;

    @ValidateIf((o) => !o.user_id)
    @IsNotEmpty()
    site_url: string;

    @IsOptional()
    @IsNotEmpty()
    user_id: string;
}
