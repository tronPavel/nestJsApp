import { AuthService } from 'src/auth/auth.service';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { VerifiedUser } from 'src/auth/types/verifiedUser.type';
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
    constructor(private readonly authService: AuthService) {
        super({
            usernameField: 'email',
        });
    }
    async validate(email: string, password: string): Promise<VerifiedUser> {
        return await this.authService.verifyUser(email, password);
    }
}
