import {IsEmail, IsString} from 'class-validator';

export class UserProfileDto {
    @IsString()
    id: string;

    @IsString()
    username: string;

    @IsEmail()
    email: string;
}