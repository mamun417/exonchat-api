import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
    // @IsEmail()
    // @IsNotEmpty()
    // email: string;

    @IsString()
    @IsNotEmpty()
    full_name: string;

    @IsString()
    @IsNotEmpty()
    display_name: string;

    @IsOptional()
    @IsString()
    phone: string;

    @IsOptional()
    @IsString()
    address: string;

    @IsOptional()
    @IsString()
    facebook: string;

    @IsOptional()
    @IsString()
    twitter: string;

    @IsOptional()
    @IsString()
    linkedin: string;
}
