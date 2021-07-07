import { IsNotEmpty } from 'class-validator';

export class UpdateLastMsgSeenTimeDto {
    @IsNotEmpty()
    last_msg_seen_time: Date;
}
