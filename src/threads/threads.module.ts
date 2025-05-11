import { Module } from '@nestjs/common';
import { ThreadsService } from './threads.service';
import { ThreadsController } from './threads.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Thread, ThreadSchema } from './threads.schema';
import { Message, MessageSchema } from '../messages/message.schema';
import { Chat, ChatSchema } from '../chat/chat.schema';
import { MessagesModule } from '../messages/messages.module';
import { TasksModule } from '../task/tasks.module';
import { MessageService } from '../messages/messages.service';
import { ChatModule } from '../chat/chat.module';
import { Task, TasksSchema } from '../task/tasks.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Thread.name, schema: ThreadSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Chat.name, schema: ChatSchema },
      { name: Task.name, schema: TasksSchema },
    ]),
    MessagesModule, 
    ChatModule, 
    TasksModule, 
  ],
  controllers: [ThreadsController],
  providers: [ThreadsService],
  exports: [ThreadsService],
})
export class ThreadsModule {}