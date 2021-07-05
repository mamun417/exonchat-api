import { IsEnum, IsNotEmpty } from 'class-validator';

enum user_online_status_enum {
    online = 'online',
    offline = 'offline',
    invisible = 'invisible',
    vacation = 'vacation',
    sick = 'sick',
    other = 'other',
}

export class UpdateOnlineStatusDto {
    @IsNotEmpty()
    @IsEnum(user_online_status_enum)
    online_status: user_online_status_enum;
}
