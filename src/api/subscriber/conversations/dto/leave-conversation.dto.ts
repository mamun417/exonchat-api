import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class LeaveConversationDto {
    @IsBoolean()
    @IsOptional()
    do_log = true;

    @IsString()
    @IsOptional()
    socket_session_id: string;
}
