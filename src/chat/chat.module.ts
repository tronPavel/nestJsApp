import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from './chat.schema';
import { Thread, ThreadSchema } from '../threads/threads.schema';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { TasksModule } from '../task/tasks.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
      { name: Thread.name, schema: ThreadSchema },
    ]),
    forwardRef(() => TasksModule),
  ],
  providers: [ChatService],
  controllers: [ChatController],
  exports: [ChatService, MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }])], // Экспорт ChatModel
})
export class ChatModule {}