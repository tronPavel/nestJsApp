import { Injectable, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { Types } from 'mongoose';
import { SignUpDto } from './dto/signUp.dto';
import * as bcrypt from 'bcryptjs';
import { compare } from 'bcryptjs';
import { AccessToken, RefreshToken } from './types/tokens.type';
import { Response } from 'express';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { GenerateTokensService } from './services/generateTokens.service';
import { User } from '../users/users.schema';
import { Logger } from '@nestjs/common';
import {UserNotFoundException} from "../users/exception/users.exceptions";
import {VerifiedUser} from "./types/verifiedUser.type";



@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private tokenService: GenerateTokensService,
        private usersService: UsersService,
        private readonly configService: ConfigService,
    ) {}

    async signUp(data: SignUpDto): Promise<void> {
        try {
            await this.usersService.getUser({ email: data.email });
            throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
        } catch (error) {
            if (!(error instanceof UserNotFoundException)) {
                throw error;
            }
        }
        await this.usersService.create(data);
    }

    async signIn(user: User, response: Response): Promise<AccessToken> {
        const [accessToken, refreshToken] = await this.tokenService.generateTokens(
            user.id,
            user.email,
        );
        await this.updateRefreshTokenInModel(user.id, refreshToken);

        this.logger.debug(`Generated tokens - Access: ${accessToken.token}, Refresh: ${refreshToken.token}`);

        response.cookie('Refresh', refreshToken.token, {
            httpOnly: true,
            secure: this.configService.get('NODE_ENV') === 'production',
            expires: new Date(refreshToken.expiresIn),
            sameSite: 'strict',
            path: '/',
        });

        return {
            token: accessToken.token,
            expiresIn: accessToken.expiresIn,
        };
    }

    async logOut(id: string, res: Response): Promise<void> {
        await this.deleteRefreshTokenInModel(id);
        res.clearCookie('Refresh');
    }

    async refreshToken(user: User): Promise<{ accessToken: AccessToken; refreshToken: RefreshToken }> {
        const [accessToken, refreshToken] = await this.tokenService.generateTokens(user.id, user.email);
        await this.updateRefreshTokenInModel(user.id, refreshToken);
        return { accessToken, refreshToken };
    }

    async updateRefreshTokenInModel(userId: string, refreshToken: RefreshToken): Promise<void> {
        await this.usersService.updateUser(
            { _id: new Types.ObjectId(userId) },
            {
                expiresIn: refreshToken.expiresIn,
                token: await bcrypt.hash(refreshToken.token, 12),
            },
        );
    }

    async deleteRefreshTokenInModel(userId: string): Promise<void> {
        await this.usersService.updateUser(
            { _id: new Types.ObjectId(userId) },
            { token: null, expiresIn: null },
        );
    }

    async verifyUser(email: string, password: string): Promise<VerifiedUser> {
        const user = await this.usersService.getUser({ email });
        if (!user || !(await compare(password, user.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return { id: String(user._id), email: user.email };
    }

    async verifyUserRefreshToken(refreshToken: string, userId: string): Promise<VerifiedUser> {
        const user = await this.usersService.getUser({ _id: new Types.ObjectId(userId) });
        if (!user.token || !(await compare(refreshToken, user.token))) {
            throw new UnauthorizedException('Invalid refresh token');
        }
        if (user.expiresIn && user.expiresIn < Date.now()) {
            throw new UnauthorizedException('Refresh token expired');
        }
        return { id: String(user._id), email: user.email };
    }
}