import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/users/users.schema';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersModule } from 'src/users/users.module';
import { LocalStrategy } from 'src/auth/strategies/locale.strategy';
import { JwtAccessStrategy } from 'src/auth/strategies/jwt-acces.strategy';
import { JwtRefreshStrategy } from 'src/auth/strategies/jwt-refresh.strategy';

import { GenerateTokensService } from 'src/auth/services/generateTokens.service';


@Module({
    imports: [
        PassportModule.register({ session: false }),
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                return {
                    secret: config.get<string>('JWT_ACCESS_SECRET'),
                    signOptions: {
                        expiresIn: config.get<string | number>('JWT_ACCESS_SECRET_EXPIRES'),
                    },
                };
            },
        }),
        MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
        UsersModule,
    ],
    controllers: [AuthController],
    providers: [
        GenerateTokensService,
        AuthService,
        JwtRefreshStrategy,
        JwtAccessStrategy,
        LocalStrategy,
    ],
    exports: [PassportModule,
        JwtModule],
})
export class AuthModule {}
