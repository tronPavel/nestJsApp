import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { Room, RoomSchema} from "./rooms.schema";
import {MongooseModule} from "@nestjs/mongoose";
import {RoomParticipantsGuard} from "./guard/room-participants.guard";
import {RoomModeratorGuard} from "./guard/room-moderator.guard";
import {UsersModule} from "../users/users.module";
import {AuthModule} from "../auth/auth.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Room.name,
        schema: RoomSchema,
      },
    ]),
    UsersModule,
    AuthModule
  ],
  controllers: [RoomsController],
  providers: [
    RoomsService,
    RoomParticipantsGuard,
    RoomModeratorGuard,
    ],
  exports: [RoomsService],
})
export class RoomsModule {}
