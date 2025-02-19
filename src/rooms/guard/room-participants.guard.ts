import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { RoomsService } from '../rooms.service';

@Injectable()
export class RoomParticipantsGuard implements CanActivate {
    constructor(private readonly roomsService: RoomsService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const roomId = request.params.id || request.body.roomId;

        if (!roomId) {
            throw new HttpException('Room ID is required', HttpStatus.BAD_REQUEST);
        }

        const room = await this.roomsService.findById(roomId);

        if (!room.participants.some(p => p._id.toString() === user._id.toString())) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }

        request.room = room;
        return true;
    }
}
