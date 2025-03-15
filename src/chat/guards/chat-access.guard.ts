import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat } from '../chat.schema';
import { Task } from '../../task/tasks.schema';

@Injectable()
export class ChatAccessGuard implements CanActivate {
    constructor(
        @InjectModel(Chat.name) private chatModel: Model<Chat>,
        @InjectModel(Task.name) private taskModel: Model<Task>,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        console.log('Request body in ChatAccessGuard:', req.body);
        const user = req.user;
console.log(req.params.id);
        // Получаем chatId из body (для POST-запросов с form-data)
        const chatId = req.body?.chatId || req.params.chatId;
        if (!chatId) {
            throw new HttpException('chatId is required', HttpStatus.BAD_REQUEST);
        }

        const chat = await this.chatModel.findById(chatId).exec();
        if (!chat) {
            throw new HttpException('Чат не найден', HttpStatus.NOT_FOUND);
        }

        const task = await this.taskModel.findById(chat.task).select('participants').exec();
        if (!task) {
            throw new HttpException('Задача не найдена', HttpStatus.NOT_FOUND);
        }

        const isTaskParticipant = task.participants.some(p => p.toString() === user._id.toString());
        if (!isTaskParticipant) {
            throw new HttpException('Доступ запрещён', HttpStatus.FORBIDDEN);
        }

        return true;
    }
}