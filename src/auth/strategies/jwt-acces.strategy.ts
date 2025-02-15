import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { Types } from 'mongoose';

type Payload = {
    sub: string;
    email: string;
    expires_in: number;
};

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        configService: ConfigService,
        private readonly usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.getOrThrow('JWT_ACCESS_SECRET'),
           // expireIn: configService.getOrThrow('JWT_ACCESS_SECRET_EXPIRES'),
        });
    }
    async validate(payload: Payload) {
        return this.usersService.getUser({ _id: new Types.ObjectId(payload.sub) });
    }
}

