import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { Room, RoomSchema} from "./rooms.schema";
import {MongooseModule} from "@nestjs/mongoose";
import {TasksModule} from "../task/tasks.module";
import {ChatModule} from "../chat/chat.module";
import {RoomParticipantsGuard} from "./guard/room-participants.guard";
import {RoomModeratorGuard} from "./guard/room-moderator.guard";
import {UsersModule} from "../users/users.module";
import {RoomGateway} from "./room.gateway";
import {JwtService} from "@nestjs/jwt";
import {ThreadsModule} from "../threads/threads.module";
import {MessagesModule} from "../messages/messages.module";
import {AuthModule} from "../auth/auth.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Room.name,
        schema: RoomSchema,
      },
    ]),
      TasksModule,
    UsersModule,
    ChatModule,
    ThreadsModule,
      MessagesModule,
    AuthModule
  ],
  controllers: [RoomsController],
  providers: [RoomsService,
    RoomParticipantsGuard,
    RoomModeratorGuard,
    RoomGateway],
  exports: [RoomsService],
  //, MongooseModule.forFeature([{name: Room.name,  schema: RoomSchema}])
})
export class RoomsModule {}
