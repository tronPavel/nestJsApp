import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RoomsModule } from './rooms/rooms.module';
import { TasksModule } from './task/tasks.module';
import { MessagesModule } from './messages/messages.module';
import { ChatModule } from './chat/chat.module';
import { ThreadsModule } from './threads/threads.module';
import { FileModule } from './files/file.module';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import { RoomGateway } from './rooms/room.gateway';

// @ts-ignore
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true, // Делает ConfigModule доступным повсеместно
    }),
    MongooseModule.forRoot(process.env.DB_URL),
    MulterModule.register({
      //multer.diskStorage({ destination: './uploads' })
      storage: multer.memoryStorage(), // или multer.diskStorage({ destination: './uploads' })
    }),
    UsersModule,
    AuthModule,
    RoomsModule,
    TasksModule,
    MessagesModule,
    ChatModule,
    ThreadsModule,
    FileModule,

  ],
  providers: [RoomGateway], // Доступен для всех модулей
})
export class AppModule {}