import { IsEmail, IsStrongPassword } from 'class-validator';
export class UserDto {
    @IsEmail()
    email: string;

    @IsStrongPassword()
    password: string;
}
