import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  HttpException,
  UsePipes,
  ValidationPipe, Delete,
} from '@nestjs/common';
import {PopulatedRoom, RoomsService} from './rooms.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VerifiedUser } from '../auth/decarators/VerifiedUser.decarator';
import { User } from '../users/users.schema';
import {CreateRoomDto} from "./dto/create-room.dto";
import {RoomDto} from "./dto/room.dto";
import {RoomModeratorGuard} from "./guard/room-moderator.guard";

import { RoomFromGuard} from "./decorators/room.decorator";
import {RoomParticipantsGuard} from "./guard/room-participants.guard";


@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(
      private readonly roomsService: RoomsService,
      private readonly usersService: UsersService,
  ) {
  }

  @Post()
  @UsePipes(new ValidationPipe({transform: true}))
  async createRoom(
      @Body() createRoomDto: CreateRoomDto,
      @VerifiedUser() user: User,
  ): Promise<RoomDto> {
    const room = await this.roomsService.create({
      name: createRoomDto.name,
      moderator: user._id.toString(),
      participants: [user._id.toString()],
    });
    const populatedRoom = await this.roomsService.findById(room._id.toString());
    return this.mapRoomToDto(populatedRoom);
  }

  @Get('/my-rooms')
  async getMyRooms(
      @VerifiedUser() user: User
  ): Promise<{ created: RoomDto[]; participating: RoomDto[] }> {
    const createdRooms = await this.roomsService.findByModerator(user._id.toString());
    const participatingRooms = await this.roomsService.findByParticipant(user._id.toString());
    return {
      created: createdRooms.map(room => this.mapRoomToDto(room)),
      participating: participatingRooms.map(room => this.mapRoomToDto(room)),
    };
  }


  @Get('/:id')
  @UseGuards(RoomParticipantsGuard)
  async getRoom(
      @RoomFromGuard() room: PopulatedRoom,
  ): Promise<RoomDto> {
    console.log(room);
    return this.mapRoomToDto(room);
  }

  @Delete(':id')
  @UseGuards(RoomModeratorGuard)
  async deleteRoom(@Param('id') id: string) {
    await this.roomsService.delete(id);
    return { success: true };
  }


  private mapRoomToDto(room: PopulatedRoom): RoomDto {
    return {
      id: room._id.toString(),
      name: room.name,
      moderator: {
        id: room.moderator._id.toString(),
        username: room.moderator.username,
      },
      participants: room.participants.map(p => ({
        id: p._id.toString(),
        username: p.username,
      })),
      tasks: room.tasks.map(t => ({
        id: t._id.toString(),
        title: t.title,
      })),
    };
  }
}