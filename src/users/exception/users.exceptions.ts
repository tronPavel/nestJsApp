import { HttpException, HttpStatus } from '@nestjs/common';

export class UserAlreadyExistsException extends HttpException {
    constructor() {
        super('User with this email already exists', HttpStatus.CONFLICT);
    }
}

export class UserNotFoundException extends HttpException {
    constructor() {
        super('User does not exist', HttpStatus.NOT_FOUND);
    }
}

export class CreateUserFailedException extends HttpException {
    constructor() {
        super('Failed to create user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
