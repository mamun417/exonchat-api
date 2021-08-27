import { IsOptional, IsString } from 'class-validator';

export class LeaveConversationDto {
    @IsString()
    @IsOptional()
    socket_session_id: string;
}
