import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from 'src/auth/auth.service';

type Payload = {
    sub: string;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
    Strategy,
    'jwt-refresh',
) {
    constructor(
        configService: ConfigService,
        private readonly authService: AuthService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
               (request: Request) => {
                console.log(request.cookies)
                return request.cookies.Refresh
            }

            ]),
            secretOrKey: configService.getOrThrow('JWT_REFRESH_SECRET'),
          // expireIn: configService.getOrThrow('JWT_REFRESH_SECRET_EXPIRES'),
            passReqToCallback: true,
        });
    }
    async validate(request: Request, payload: Payload) {
        return await this.authService.verifyUserRefreshToken(
            request.cookies.Refresh,
            payload.sub,
        );
    }
}
