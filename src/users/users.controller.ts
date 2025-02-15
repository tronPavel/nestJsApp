import {Controller, Get, UseGuards} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { User } from './users.schema';
import {VerifiedUser} from "../auth/decarators/VerifiedUser.decarator";
import {UserProfileDto} from "./dto/user-profile.dto";

@Controller('users')
export class UsersController {
    constructor() {}

    @Get('/me')
    @UseGuards(JwtAuthGuard)
    async getMe(@VerifiedUser() user: User): Promise<UserProfileDto> {
        return {
            id: user._id.toString(),
            username: user.username,
            email: user.email
        };
    }
}
