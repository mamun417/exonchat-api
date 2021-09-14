import { IsNotEmpty, IsString, IsEmail, IsObject, IsArray } from 'class-validator';

interface authResponse {
    userID: string;
    accessToken: string;
}

export class FacebookConnectDto {
    @IsObject()
    auth_response: authResponse;

    @IsObject()
    user_response: object;
}
