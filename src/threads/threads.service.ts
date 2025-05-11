import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { ClientSession, Model, Types } from 'mongoose';
import { Thread } from './threads.schema';
import { Message } from '../messages/message.schema';
import { Chat } from '../chat/chat.schema';
import { Task } from '../task/tasks.schema';
import { MessageService } from '../messages/messages.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreateMessageDto } from '../messages/dto/create-message.dto';
import { ThreadHistoryDto } from './dto/history-thread.dto';

@Injectable()
export class ThreadsService {
  private readonly logger = new Logger(ThreadsService.name);

  constructor(
      @InjectModel(Thread.name) private threadModel: Model<Thread>,
      @InjectModel(Message.name) private messageModel: Model<Message>,
      @InjectModel(Chat.name) private chatModel: Model<Chat>,
      @InjectModel(Task.name) private taskModel: Model<Task>,
      private messageService: MessageService
  ) {}

  /*async create(createThreadDto: CreateThreadDto, userId: string, files: Express.Multer.File[] = [], session?: ClientSession): Promise<Thread> {
    this.logger.log(`Creating thread for chat ${createThreadDto.chatId}`);

    const localSession = session || (await this.threadModel.db.startSession());
    try {
      let thread;
      let populatedThread;
      await localSession.withTransaction(async () => {
        const chat = await this.chatModel.findById(createThreadDto.chatId).session(localSession).exec();
        if (!chat) throw new NotFoundException('Chat not found');

        thread = (
            await this.threadModel.create(
                [
                  {
                    chat: new Types.ObjectId(createThreadDto.chatId),
                    replies: [],
                  },
                ],
                { session: localSession }
            )
        )[0];

        const messageDto: CreateMessageDto = {
          threadId: thread._id.toString(),
          content: createThreadDto.mainMessage,
          tags: createThreadDto.tags,
        };

        const msg = await this.messageService.create(messageDto, userId, files, localSession, true);
        if (!msg || !msg._id) {
          throw new BadRequestException('Failed to create message');
        }

        await this.threadModel
            .updateOne(
                { _id: thread._id },
                { mainMessage: msg._id },
                { session: localSession }
            )
            .exec();

        await this.chatModel
            .updateOne(
                { _id: chat._id },
                { $push: { threads: thread._id } },
                { session: localSession }
            )
            .exec();

        populatedThread = await this.threadModel
            .findById(thread._id)
            .session(localSession)
            .populate('mainMessage')
            .exec();
      });

      this.logger.log(`Thread created: ${thread._id}`);
      return populatedThread;
    } catch (e) {
      this.logger.error(`Failed to create thread: ${e.message}`);
      if (e instanceof NotFoundException || e instanceof BadRequestException) {
        throw e;
      }
      throw new BadRequestException(`Failed to create thread: ${e.message}`);
    } finally {
      if (!session) {
        localSession.endSession();
        this.logger.log('Session ended');
      }
    }
  }*/
// threads.service.ts
  async create(createThreadDto: CreateThreadDto, userId: string, session?: ClientSession): Promise<Thread> {
    this.logger.log(`Creating thread for chat ${createThreadDto.chatId}`);

    const localSession = session || (await this.threadModel.db.startSession());
    try {
      let thread;
      let populatedThread;
      await localSession.withTransaction(async () => {
        const chat = await this.chatModel.findById(createThreadDto.chatId).session(localSession).exec();
        if (!chat) throw new NotFoundException('Chat not found');

        thread = (
            await this.threadModel.create(
                [{ chat: new Types.ObjectId(createThreadDto.chatId), replies: [] }],
                { session: localSession }
            )
        )[0];

        const messageDto: CreateMessageDto = {
          threadId: thread._id.toString(),
          content: createThreadDto.mainMessage,
          tags: createThreadDto.tags,
          fileIds: createThreadDto.fileIds, // Используем fileIds из DTO
        };

        const msg = await this.messageService.create(messageDto, userId, localSession, true);
        if (!msg || !msg._id) throw new BadRequestException('Failed to create message');

        await this.threadModel
            .updateOne({ _id: thread._id }, { mainMessage: msg._id }, { session: localSession })
            .exec();

        await this.chatModel
            .updateOne({ _id: chat._id }, { $push: { threads: thread._id } }, { session: localSession })
            .exec();

        populatedThread = await this.threadModel
            .findById(thread._id)
            .session(localSession)
            .populate('mainMessage')
            .exec();
      });

      this.logger.log(`Thread created: ${thread._id}`);
      return populatedThread;
    } catch (e) {
      this.logger.error(`Failed to create thread: ${e.message}`);
      if (e instanceof NotFoundException || e instanceof BadRequestException) throw e;
      throw new BadRequestException(`Failed to create thread: ${e.message}`);
    } finally {
      if (!session) localSession.endSession();
    }
  }


  async findById(id: string): Promise<Thread> {
    this.logger.log(`Finding thread by id: ${id}`);
    const thread = await this.threadModel.findById(id).populate('mainMessage replies').exec();
    if (!thread) {
      this.logger.error(`Thread ${id} not found`);
      throw new NotFoundException('Thread not found');
    }
    return thread;
  }

  async getMessages(threadId: string, historyDto: ThreadHistoryDto): Promise<Message[]> {
    const thread = await this.threadModel.findById(threadId).exec();
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }
    return await this.messageService.getMessages(
        threadId,
        (historyDto.page - 1) * historyDto.limit,
        historyDto.limit
    );
  }

  async delete(id: string): Promise<{ success: boolean }> {
    this.logger.log(`Deleting thread ${id}`);
    const session: ClientSession = await mongoose.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        const thread = await this.threadModel.findById(id).session(session).exec();
        if (!thread) {
          this.logger.error(`Thread ${id} not found`);
          throw new NotFoundException('Thread not found');
        }
        await this.threadModel.deleteOne({ _id: id }, { session }).exec();
        this.logger.log(`Thread deleted: ${id}`);
        result = { success: true };
      });
      return result;
    } catch (error) {
      this.logger.error(`Failed to delete thread: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete thread: ${error.message}`);
    } finally {
      await session.endSession();
      this.logger.log(`Session ended for thread ${id}`);
    }
  }
}