import { IsNotEmpty, IsString } from 'class-validator';

export class WhmcsOpenTicketDto {
    @IsString()
    @IsNotEmpty()
    subject: string;

    @IsNotEmpty()
    department_id: number;

    @IsString()
    @IsNotEmpty()
    priority: string;
}
