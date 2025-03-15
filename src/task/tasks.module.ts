import { forwardRef, Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TasksSchema } from './tasks.schema';
import { Room, RoomSchema } from '../rooms/rooms.schema';
import { ChatModule } from '../chat/chat.module';
import { FileModule } from '../files/file.module';
import { UsersModule } from '../users/users.module';
import { TaskParticipantGuard } from './guard/task-participants.guard';
import { TaskModeratorGuard } from './guard/task-moderator.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TasksSchema },
      { name: Room.name, schema: RoomSchema },
    ]),
    FileModule,
    forwardRef(() => ChatModule),
    UsersModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, TaskParticipantGuard, TaskModeratorGuard],
  exports: [
    TasksService,
    MongooseModule.forFeature([{ name: Task.name, schema: TasksSchema }]),
  ],
})
export class TasksModule {}