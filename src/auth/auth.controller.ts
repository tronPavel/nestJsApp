import { Body, Controller, Get, Post, HttpStatus, Req, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signUp.dto';
import { Response } from 'express';
import { LocalAuthGuard } from './guards/locale-auth.guard';
import { VerifiedUser } from './decarators/VerifiedUser.decarator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { User } from '../users/users.schema';
import {SignInDto} from "./dto/signIn.dto";

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}
//TODO смена пароля, подтверждение по почте
    @Post('/signup')
    @UsePipes(new ValidationPipe({ transform: true }))
    async signUp(@Body() data: SignUpDto, @Res() res: Response): Promise<void> {
        await this.authService.signUp(data);
        res.status(HttpStatus.CREATED).json({ message: 'User registration successfully!' });
    }

    @UsePipes(new ValidationPipe({ transform: true }))
    @UseGuards(LocalAuthGuard)
    @Post('/signin')
    async signIn(@Body() signInDto: SignInDto, @VerifiedUser() user: User, @Res() res: Response): Promise<void> {
        const accessToken = await this.authService.signIn(user, res);
        res.status(HttpStatus.OK).json({
            message: 'Login successfully!',
            data: accessToken,
        });
    }

    @UseGuards(JwtAuthGuard)
    @Post('/logout')
    async logOut(@VerifiedUser() user: User, @Res() res: Response): Promise<void> {
        await this.authService.logOut(user._id.toString(), res);
        res.status(HttpStatus.OK).json({ message: 'Logout successfully!' });
    }
//перенес к пользователю
/*    @UseGuards(JwtAuthGuard)
    @Get('/me')
    async getMe(@VerifiedUser() user: User): Promise<User> {
        return user;
    }*/

    @UseGuards(JwtRefreshAuthGuard)
    @Post('/refresh')
    async refreshToken(@VerifiedUser() user: User, @Res() res: Response): Promise<void> {
        const { accessToken, refreshToken } = await this.authService.refreshToken(user);
        res.cookie('Refresh', refreshToken.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            expires: new Date(refreshToken.expiresIn),
            sameSite: 'strict',
            path: '/',
        });
        res.status(HttpStatus.OK).json(accessToken);
    }
}
