import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRatingDto {
    @IsString()
    @IsNotEmpty()
    conversation_id: string;

    @IsNumber()
    @IsNotEmpty()
    rating: number;

    @IsOptional()
    @IsString()
    comment: string;
}
