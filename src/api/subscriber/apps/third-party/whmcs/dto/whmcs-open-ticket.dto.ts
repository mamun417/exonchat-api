import { IsNotEmpty, IsString } from 'class-validator';

export class WhmcsOpenTicketDto {
    @IsString()
    @IsNotEmpty()
    subject: string;
}
