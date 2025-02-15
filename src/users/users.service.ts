import { Injectable } from '@nestjs/common';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { User } from './users.schema';
import { InjectModel } from '@nestjs/mongoose';
import { UserDto } from 'src/users/dto/user.dto';
import { hash } from 'bcrypt';
import {
    UserAlreadyExistsException,
    UserNotFoundException,
    CreateUserFailedException,
} from 'src/users/exception/users.exceptions';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<User>,
    ) {}

    async create(UserDto: UserDto) {
        return await new this.userModel({
            ...UserDto,
            password: await hash(UserDto.password, 10),
        }).save();
    }

    async getUser(query: FilterQuery<User>): Promise<User> {
        const user = await this.userModel.findOne(query).exec();
        if (!user) {
            throw new UserNotFoundException();
        }
        return user.toObject();
    }

    async getUsers() {
        return this.userModel.find({});
    }

    async updateUser(query: FilterQuery<User>, data: UpdateQuery<User>) {
        const result = await this.userModel.findOneAndUpdate(query, data);
        if (!result) {
            throw new UserNotFoundException();
        }
    }


}
