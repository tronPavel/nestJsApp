import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AccessToken, RefreshToken } from '../types/tokens.type';

const ms = require('ms');

@Injectable()
export class GenerateTokensService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor(
      private jwtService: JwtService,
      private configService: ConfigService,
  ) {
    this.accessSecret = configService.get('JWT_ACCESS_SECRET');
    this.refreshSecret = configService.get('JWT_REFRESH_SECRET');
    this.accessExpiresIn = configService.get('JWT_ACCESS_SECRET_EXPIRES');
    this.refreshExpiresIn = configService.get('JWT_REFRESH_SECRET_EXPIRES');
  }

  async generateTokens(userId: string, email: string): Promise<[AccessToken, RefreshToken]> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(userId, email),
      this.generateRefreshToken(userId),
    ]);
    return [accessToken, refreshToken];
  }

  private async generateAccessToken(userId: string, email: string): Promise<AccessToken> {
    const token = await this.jwtService.signAsync(
        { sub: userId, email },
        { secret: this.accessSecret, expiresIn: this.accessExpiresIn },
    );
    return { token, expiresIn: this.calculateTokenExpiration(this.accessExpiresIn) };
  }

  private async generateRefreshToken(userId: string): Promise<RefreshToken> {
    const token = await this.jwtService.signAsync(
        { sub: userId },
        { secret: this.refreshSecret, expiresIn: this.refreshExpiresIn },
    );
    return { token, expiresIn: this.calculateTokenExpiration(this.refreshExpiresIn) };
  }

  private calculateTokenExpiration(expiresIn: string): number {
    return Date.now() + ms(expiresIn);
  }
}