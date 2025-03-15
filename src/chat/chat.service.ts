import { Injectable, NotFoundException, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Chat } from './chat.schema';
import { Thread } from '../threads/threads.schema';


@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);

    constructor(
        @InjectModel(Chat.name) private chatModel: Model<Chat>,
        @InjectModel(Thread.name) private threadModel: Model<Thread>,
    ) {}

    async addTaskId(chatId: string, taskId: string, session: ClientSession): Promise<void> {
        this.logger.log(`Adding task ${taskId} to chat ${chatId}`);
        const chat = await this.chatModel.findById(chatId).session(session).exec();
        if (!chat) {
            this.logger.error(`Chat ${chatId} not found`);
            throw new NotFoundException('Chat not found');
        }
        await this.chatModel
            .findByIdAndUpdate(chatId, { task: new Types.ObjectId(taskId) }, { session })
            .exec();
        this.logger.log(`Task ${taskId} added to chat ${chatId}`);
    }

    async create(dto: any, session?: ClientSession): Promise<Chat> {
        this.logger.log('Creating new chat');
        const chat = new this.chatModel({});
        const savedChat = await chat.save({ session });
        this.logger.log(`Chat created: ${savedChat._id}`);
        return savedChat;
    }

}