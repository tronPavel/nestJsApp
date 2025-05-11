import { Injectable, NotFoundException, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Chat } from './chat.schema';
import { Thread } from '../threads/threads.schema';
import { ChatHistoryDto } from './dto/ChatHistoryDto';

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

    async getChatHistory(id: string, chatHistoryDto: ChatHistoryDto): Promise<Thread[]> {
        this.logger.log(`Fetching chat history for chat ${id}`);
        const chat = await this.chatModel.findById(id).exec();
        if (!chat) {
            this.logger.error(`Chat ${id} not found`);
            throw new NotFoundException('Chat not found');
        }
        const threads = await this.threadModel
            .find({ chat: chat._id })
            .limit(chatHistoryDto.limit)
            .skip((chatHistoryDto.page - 1) * chatHistoryDto.limit)
            .sort({ createdAt: -1 })
            .populate('mainMessage')
            .exec();
        this.logger.log(`Retrieved ${threads.length} threads for chat ${id}`);
        return threads;
    }

    async delete(id: string, session?: ClientSession): Promise<void> {
        this.logger.log(`Deleting chat ${id}`);
        const localSession = session || (await this.chatModel.db.startSession());
        try {
            await localSession.withTransaction(async () => {
                const chat = await this.chatModel.findById(id).session(localSession).exec();
                if (!chat) {
                    this.logger.error(`Chat ${id} not found`);
                    throw new NotFoundException('Chat not found');
                }
                await this.chatModel.deleteOne({ _id: id }, { session: localSession }).exec();
                // Pre-хук удалит связанные треды
            });
            this.logger.log(`Chat deleted: ${id}`);
        } catch (error) {
            this.logger.error(`Transaction failed: ${error.message}`);
            throw new HttpException(`Transaction failed: ${error.message}`, HttpStatus.BAD_REQUEST);
        } finally {
            if (!session) {
                localSession.endSession();
                this.logger.log('Session ended');
            }
        }
    }
}