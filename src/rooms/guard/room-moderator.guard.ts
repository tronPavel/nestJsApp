/*
import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { RoomsService } from '../rooms.service';

@Injectable()
export class RoomModeratorGuard implements CanActivate {
    constructor(private readonly roomsService: RoomsService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const roomId = request.params.id;

        if (!roomId) {
            throw new HttpException('Room ID is required', HttpStatus.BAD_REQUEST);
        }

        const room = await this.roomsService.findById(roomId);

        if (room.moderator._id.toString() !== user._id.toString()) {
            throw new HttpException('Only moderator allowed', HttpStatus.FORBIDDEN);
        }

        request.room = room;
        return true;
    }
}*/
// src/rooms/guards/room-moderator.guard.ts
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
export class RoomModeratorGuard implements CanActivate {
    constructor(
        @InjectModel(Room.name) private readonly roomModel: Model<Room>,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const user = req.user;
        const roomId = req.params.id;

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

        if (room.moderator.toString() !== user._id.toString()) {
            throw new HttpException('Only moderator allowed', HttpStatus.FORBIDDEN);
        }

        req.room = room;
        return true;
    }
}
