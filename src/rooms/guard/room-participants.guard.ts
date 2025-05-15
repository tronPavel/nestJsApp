import {
    Injectable,
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Room } from '../rooms.schema';

@Injectable()
export class RoomParticipantsGuard implements CanActivate {
    constructor(
        @InjectModel(Room.name) private readonly roomModel: Model<Room>,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const user = req.user;
        const roomId = req.params.id || req.params.roomId || req.body?.roomId;

        if (!roomId) {
            throw new HttpException('Room ID is required', HttpStatus.BAD_REQUEST);
        }

        if (!Types.ObjectId.isValid(roomId)) {
            throw new HttpException('Invalid room ID', HttpStatus.BAD_REQUEST);
        }

        const room = await this.roomModel
            .findById(roomId)
            .select('moderator participants tasks')
            .exec();

        if (!room) {
            throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
        }

        if (!room.participants.some(p => p._id.toString() === user._id.toString())) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }

        req.room = room;
        return true;
    }
}