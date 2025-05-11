import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types, ClientSession } from 'mongoose';
import { Message } from './message.schema';
import { FileService } from '../files/file.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Thread } from '../threads/threads.schema';
import { UpdateMessageDto } from './dto/update-message.dto';

export interface PopulatedMessage {
    _id: string;
    thread: string;
    content: string;
    sender: { id: string; username: string };
    tags?: string;
    files: { id: string; name: string; size: number; type: string; mimetype: string }[];
}

@Injectable()
export class MessageService {
    private readonly logger = new Logger(MessageService.name);

    constructor(
        @InjectModel(Message.name) private messageModel: Model<Message>,
        @InjectModel(Thread.name) private threadModel: Model<Thread>,
        private fileService: FileService
    ) {}

   /* async create(dto: CreateMessageDto, userId: string, files: Express.Multer.File[] = [], session?: ClientSession, isMainMessage: boolean = false): Promise<PopulatedMessage> {
        let thread;
        if (!isMainMessage) {
            thread = await this.threadModel.findById(dto.threadId).session(session).exec();
            if (!thread) throw new NotFoundException('Thread not found');
        }

        const fileIds = files.length
            ? await Promise.all(files.map(file => this.fileService.uploadFile(file, session)))
            : [];

        const message = new this.messageModel({
            thread: new Types.ObjectId(dto.threadId),
            sender: new Types.ObjectId(userId),
            content: dto.content,
            tags: dto.tags,
            files: fileIds.map(fileId => new Types.ObjectId(fileId)),
        });

        const savedMessage = await message.save({ session });

        if (!isMainMessage && thread) {
            await this.threadModel
                .updateOne({ _id: thread._id }, { $push: { replies: savedMessage._id } }, { session })
                .exec();
        }

        return this.findById(savedMessage._id.toString(), session);
    }*/
// messages.service.ts
    async create(dto: CreateMessageDto, userId: string, session?: ClientSession, isMainMessage: boolean = false): Promise<PopulatedMessage> {
        let thread;
        if (!isMainMessage) {
            thread = await this.threadModel.findById(dto.threadId).session(session).exec();
            if (!thread) throw new NotFoundException('Thread not found');
        }

        // Проверка fileIds (если есть)
        const fileIds = dto.fileIds || [];
        if (fileIds.length > 0) {
            await Promise.all(fileIds.map(async fileId => {
                const file = await this.fileService.getFileMetadata(fileId);
                if (!file) throw new Error(`File ${fileId} not found`);
            }));
        }

        const message = new this.messageModel({
            thread: new Types.ObjectId(dto.threadId),
            sender: new Types.ObjectId(userId),
            content: dto.content,
            tags: dto.tags,
            files: fileIds.map(fileId => new Types.ObjectId(fileId)),
        });

        const savedMessage = await message.save({ session });

        if (!isMainMessage && thread) {
            await this.threadModel
                .updateOne({ _id: thread._id }, { $push: { replies: savedMessage._id } }, { session })
                .exec();
        }

        return this.findById(savedMessage._id.toString(), session);
    }


// messages.service.ts
    async update(id: string, dto: UpdateMessageDto, session?: ClientSession): Promise<PopulatedMessage> {
        const message = await this.messageModel.findById(id).session(session).exec();
        if (!message) throw new NotFoundException('Message not found');
        if (dto.content) message.content = dto.content;
        if (dto.tags) message.tags = dto.tags;
        await message.save({ session });
        return this.findById(id, session);
    }

    async delete(id: string, session?: ClientSession): Promise<{ success: boolean }> {
        const localSession = session || await mongoose.startSession();
        try {
            await localSession.withTransaction(async () => {
                const message = await this.messageModel.findById(id).session(localSession).exec();
                if (!message) throw new NotFoundException('Message not found');
                await this.messageModel.deleteOne({ _id: id }, { session: localSession }).exec();
                await this.threadModel.updateOne(
                    { replies: new Types.ObjectId(id) },
                    { $pull: { replies: new Types.ObjectId(id) } },
                    { session: localSession }
                ).exec();
            });
            return { success: true };
        } catch (error) {
            throw error instanceof NotFoundException ? error : new BadRequestException(`Failed to delete message: ${error.message}`);
        } finally {
            if (!session) localSession.endSession();
        }
    }

    async findById(id: string, session?: ClientSession): Promise<PopulatedMessage> {
        const query = this.messageModel
            .findById(id)
            .populate('thread sender files');

        if (session) {
            query.session(session);
        }

        const message = await query.exec();
        if (!message) throw new NotFoundException('Message not found');

        const populatedMessage: PopulatedMessage = {
            _id: message._id.toString(),
            thread: message.thread.toString(),
            content: message.content,
            sender: {
                id: message.sender ? (message.sender as any)._id.toString() : 'Unknown',
                username: message.sender ? (message.sender as any).username || 'Unknown' : 'Unknown',
            },
            tags: message.tags,
            files: message.files.map(file => ({
                id: (file as any)._id.toString(),
                name: (file as any).filename,
                size: (file as any).length,
                type: (file as any).type,
                mimetype: (file as any).mimetype,
            })),
        };
        return populatedMessage;
    }

  /*  async delete(id: string): Promise<{ success: boolean }> {
        this.logger.log(`Deleting message ${id}`);
        const session: ClientSession = await mongoose.startSession();
        try {
            let result;
            await session.withTransaction(async () => {
                const message = await this.messageModel.findById(id).session(session).exec();
                if (!message) {
                    this.logger.error(`Message ${id} not found`);
                    throw new NotFoundException('Message not found');
                }

                await this.messageModel.deleteOne({ _id: id }, { session }).exec();

                await this.threadModel.updateOne(
                    { replies: new Types.ObjectId(id) },
                    { $pull: { replies: new Types.ObjectId(id) } },
                    { session }
                ).exec();

                this.logger.log(`Message deleted: ${id}`);
                result = { success: true };
            });
            return result;
        } catch (error) {
            this.logger.error(`Failed to delete message: ${error.message}`);
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(`Failed to delete message: ${error.message}`);
        } finally {
            await session.endSession();
            this.logger.log(`Session ended for message ${id}`);
        }
    }*/

    async getMessages(threadId: string, skip: number, limit: number): Promise<Message[]> {
        return this.messageModel
            .find({ thread: new Types.ObjectId(threadId) })
            .skip(skip)
            .limit(limit)
            .populate('sender files')
            .sort({ createdAt: 1 })
            .exec();
    }
}