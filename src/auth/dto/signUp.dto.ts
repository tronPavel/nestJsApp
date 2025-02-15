import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SignUpDto {
    @IsNotEmpty()
    @IsEmail()
    readonly email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    readonly password: string;

@IsNotEmpty()
@IsString()
    username: string;
}