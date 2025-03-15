import {HttpException, HttpStatus, Injectable, Logger, NotFoundException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { ClientSession, Model, Types } from 'mongoose';
import { Room } from './rooms.schema';
import { User } from '../users/users.schema';
import { Task } from '../task/tasks.schema';
import { TasksService } from '../task/tasks.service';

export interface PopulatedRoom extends Room {
  moderator: User;
  participants: User[];
  tasks: Task[];
}

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);
  constructor(
      @InjectModel(Room.name) private roomModel: Model<Room>,
      private tasksService: TasksService
  ) {}

  async create(data: {
    name: string;
    moderator: string;
    participants: string[];
  }): Promise<Room> {
    const room = new this.roomModel({
      name: data.name,
      moderator: new Types.ObjectId(data.moderator),
      participants: data.participants.map(id => new Types.ObjectId(id)),
      tasks: [],
    });
    return room.save();
  }

  async findById(id: string): Promise<PopulatedRoom> {
    const room = await this.roomModel
        .findById(id)
        .populate('moderator participants tasks')
        .exec();
    if (!room) {
      throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
    }
    return room as PopulatedRoom;
  }

  async update(
      id: string,
      data: { name?: string; participants?: string[] }
  ): Promise<PopulatedRoom> {
    const updated = await this.roomModel
        .findByIdAndUpdate(id, data, { new: true })
        .populate('moderator participants tasks')
        .exec();
    if (!updated) {
      throw new NotFoundException('Room not found');
    }
    return updated as PopulatedRoom;
  }

  async addParticipant(roomId: string, userId: string): Promise<PopulatedRoom> {
    const updated = await this.roomModel
        .findByIdAndUpdate(roomId, { $addToSet: { participants: userId } }, { new: true })
        .populate('moderator participants tasks')
        .exec();
    if (!updated) {
      throw new NotFoundException('Room not found');
    }
    return updated as PopulatedRoom;
  }

  async findByModerator(moderatorId: string): Promise<PopulatedRoom[]> {
    const rooms = await this.roomModel
        .find({ moderator: moderatorId })
        .populate('moderator participants tasks')
        .exec();
    return rooms as PopulatedRoom[];
  }

  async findByParticipant(participantId: string): Promise<PopulatedRoom[]> {
    const rooms = await this.roomModel
        .find({ participants: participantId })
        .populate('moderator participants tasks')
        .exec();
    return rooms as PopulatedRoom[];
  }
  async delete(id: string): Promise<void> {}
}