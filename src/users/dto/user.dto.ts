import { IsEmail, IsStrongPassword } from 'class-validator';
//TODO  переделать либо убарть
export class UserDto {
    @IsEmail()
    email: string;

    @IsStrongPassword()
    password: string;
}
