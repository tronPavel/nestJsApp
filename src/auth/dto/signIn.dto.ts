import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
export class SignInDto {
    @IsNotEmpty()
    @IsEmail()
    readonly email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    readonly password: string;
}
