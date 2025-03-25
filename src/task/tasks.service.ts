import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types, ClientSession } from 'mongoose';
import { Room } from '../rooms/rooms.schema';
import { User } from '../users/users.schema';
import { Task } from './tasks.schema';
import { Chat } from '../chat/chat.schema';
import { File } from '../files/file.schema';
import { ChatService } from '../chat/chat.service';
import { FileService } from '../files/file.service';
import { UsersService } from '../users/users.service';
import { TaskStatus } from './enums/task-status.enum';

export interface PopulatedTask {
    _id: string;
    title: string;
    description?: string;
    status: string;
    moderator: User;
    participants: User[];
    files: { _id: string; name: string; size: number; type: 'image' | 'video' | 'file'; mimetype: string }[];
    chat: string;
    parentTask?: Task;
    subTasks?: Task[];
    room: string;
}

@Injectable()
export class TasksService {
    constructor(
        @InjectModel(Task.name) private taskModel: Model<Task>,
        @InjectModel(Room.name) private roomModel: Model<Room>,
        private chatService: ChatService,
        private fileService: FileService,
        private usersService: UsersService
    ) {}

    async create(createTaskDto: CreateTaskDto, userId: string, files: Express.Multer.File[]): Promise<PopulatedTask> {
        this.validateRoomId(createTaskDto.roomId);

        const session = await this.taskModel.db.startSession();
        try {
            let result: PopulatedTask;
            await session.withTransaction(async () => {
                const participants = await this.validateParticipants(createTaskDto.participants || [], userId);
                const parentTask = await this.getParentTask(createTaskDto.parentTaskId, createTaskDto.roomId, session);
                const chat = await this.createChat(session);
                console.log(1)
                const fileIds = await this.uploadFiles(files, session);
                console.log(2)
                const task = await this.createTaskEntity(createTaskDto, userId, participants, fileIds, chat._id as Types.ObjectId, parentTask?._id as Types.ObjectId, session);
                console.log(3)

                await this.linkTaskToChat(chat._id as Types.ObjectId, task._id as Types.ObjectId, session);
                console.log(4)

                await this.updateParentOrRoom(task, parentTask, createTaskDto.roomId, session);
                console.log(5)

                result = await this.findById(task._id.toString(), session);
            });
            return result;
        } catch (error) {
            throw new HttpException(`Transaction failed: ${error.message}`, HttpStatus.BAD_REQUEST);
        } finally {
            await session.endSession();
        }
    }

    private validateRoomId(roomId: string): void {
        if (!roomId) throw new HttpException('Room ID is required', HttpStatus.BAD_REQUEST);
        if (!Types.ObjectId.isValid(roomId)) throw new HttpException('Invalid room ID', HttpStatus.BAD_REQUEST);
    }

    private async validateParticipants(participantIds: string[], userId: string): Promise<string[]> {
        const allIds = [userId, ...participantIds];
        await Promise.all(
            allIds.map(async id => {
                const user = await this.usersService.getUser({ _id: id });
                if (!user) throw new HttpException(`User ${id} not found`, HttpStatus.NOT_FOUND);
            })
        );
        return allIds;
    }

    private async getParentTask(parentTaskId: string | undefined, roomId: string, session: ClientSession): Promise<Task | null> {
        if (!parentTaskId) return null;
        const parentTask = await this.taskModel.findById(parentTaskId).session(session).exec();
        if (!parentTask || parentTask.room.toString() !== roomId) {
            throw new HttpException('Parent task not found or invalid', HttpStatus.NOT_FOUND);
        }
        return parentTask;
    }

    private async createChat(session: ClientSession): Promise<Chat> {
        return await this.chatService.create(null, session) as Chat;
    }

    private async uploadFiles(files: Express.Multer.File[], session: ClientSession): Promise<string[]> {
        return files.length
            ? await Promise.all(files.map(file => this.fileService.uploadFile(file, session)))
            : [];
    }

    private async createTaskEntity(
        dto: CreateTaskDto,
        userId: string,
        participants: string[],
        fileIds: string[],
        chatId: Types.ObjectId,
        parentTaskId: Types.ObjectId | undefined,
        session: ClientSession
    ): Promise<Task> {
        const task = new this.taskModel({
            title: dto.title,
            description: dto.description,
            status: TaskStatus.TODO,
            moderator: new Types.ObjectId(userId),
            participants: participants.map(id => new Types.ObjectId(id)),
            files: fileIds.map(id => new Types.ObjectId(id)),
            chat: chatId,
            parentTask: parentTaskId || null,
            subTasks: [],
            room: new Types.ObjectId(dto.roomId),
        });
        await task.save({ session });
        return task as Task;
    }

    private async linkTaskToChat(chatId: Types.ObjectId, taskId: Types.ObjectId, session: ClientSession): Promise<void> {
        await this.chatService.addTaskId(chatId.toString(), taskId.toString(), session);
    }

    private async updateParentOrRoom(task: Task, parentTask: Task | null, roomId: string, session: ClientSession): Promise<void> {
        if (parentTask) {
            await this.taskModel.updateOne(
                { _id: parentTask._id },
                { $push: { subTasks: task._id },
                    $addToSet: { participants: task.moderator._id } },
                { session }
            ).exec();
        } else {
            await this.roomModel.updateOne(
                { _id: roomId },
                { $push: { tasks: task._id } },
                { session }
            ).exec();
        }
    }

    async update(taskId: string, dto: UpdateTaskDto, files: Express.Multer.File[] = []): Promise<PopulatedTask> {
        const session = await this.taskModel.db.startSession();
        try {
            let result: PopulatedTask;
            await session.withTransaction(async () => {
                const task = await this.getTaskById(taskId, session);
                const participantsToAdd = await this.validateParticipantsToAdd(dto.participantsToAdd || []);
                const fileIds = await this.handleFileUpdates(task.files, files, dto.fileIdsToRemove, session);
                const participants = this.updateParticipants(task.participants, dto.participantsToAdd, dto.participantsToRemove);
                const updatedTask = await this.updateTaskEntity(task._id, dto, fileIds, participants, session);
                result = this.mapToPopulatedTask(updatedTask);
            });
            return result;
        } catch (error) {
            throw new HttpException(`Transaction failed: ${error.message}`, HttpStatus.BAD_REQUEST);
        } finally {
            session.endSession();
        }
    }

    private async getTaskById(taskId: string, session: ClientSession): Promise<PopulatedTask> {
        const task = await this.findById(taskId, session);
        if (!task) throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
        return task;
    }

    private async validateParticipantsToAdd(participantsToAdd: string[]): Promise<void> {
        await Promise.all(
            participantsToAdd.map(async id => {
                const user = await this.usersService.getUser({ _id: id });
                if (!user) throw new HttpException(`User ${id} not found`, HttpStatus.NOT_FOUND);
            })
        );
    }

    private async handleFileUpdates(
        existingFiles: { _id: string }[],
        newFiles: Express.Multer.File[],
        fileIdsToRemove: string[] | undefined,
        session: ClientSession
    ): Promise<string[]> {
        let fileIds = existingFiles.map(file => file._id);
        if (newFiles.length > 0) {
            const newFileIds = await Promise.all(
                newFiles.map(file => this.fileService.uploadFile(file, session))
            );
            fileIds = [...fileIds, ...newFileIds];
        }
        if (fileIdsToRemove && fileIdsToRemove.length > 0) {
            fileIds = fileIds.filter(id => !fileIdsToRemove.includes(id));
            await Promise.all(
                fileIdsToRemove.map(id => this.fileService.deleteFile(id, session))
            );
        }
        return fileIds;
    }

    private updateParticipants(
        existingParticipants: User[],
        participantsToAdd: string[] | undefined,
        participantsToRemove: string[] | undefined
    ): string[] {
        let participants = existingParticipants.map(p => p._id.toString());
        if (participantsToAdd && participantsToAdd.length > 0) {
            participants = [...new Set([...participants, ...participantsToAdd])];
        }
        if (participantsToRemove && participantsToRemove.length > 0) {
            participants = participants.filter(p => !participantsToRemove.includes(p));
        }
        return participants;
    }

    private async updateTaskEntity(
        taskId: string,
        dto: UpdateTaskDto,
        fileIds: string[],
        participants: string[],
        session: ClientSession
    ): Promise<Task> {
        const updated = await this.taskModel
            .findByIdAndUpdate(
                taskId,
                {
                    title: dto.title ?? undefined,
                    description: dto.description ?? undefined,
                    status: dto.status ?? undefined,
                    files: fileIds.map(id => new Types.ObjectId(id)),
                    participants: participants.map(p => new Types.ObjectId(p)),
                },
                { new: true, session }
            )
            .populate('moderator participants chat subTasks room parentTask files')
            .exec();

        if (!updated) throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
        return updated;
    }

    private mapToPopulatedTask(task: Task): PopulatedTask {
        const fileMetadata = (task.files as File[]).map(file => ({
            _id: file._id.toString(),
            name: file.filename,
            size: file.length,
            type: file.type,
            mimetype: file.mimetype,
        }));
        return {
            _id: task._id.toString(),
            title: task.title,
            description: task.description,
            status: task.status,
            moderator: task.moderator as User,
            participants: task.participants as User[],
            files: fileMetadata,
            chat: task.chat._id.toString(),
            parentTask: task.parentTask as Task | undefined,
            subTasks: task.subTasks as Task[] | undefined,
            room: task.room._id.toString(),
        };
    }


    async findById(id: string, session?: ClientSession): Promise<PopulatedTask> {
        const task = await this.fetchTaskById(id, session);
        return this.mapToPopulatedTask(task);
    }

    private async fetchTaskById(id: string, session?: ClientSession): Promise<Task> {
        const task = await this.taskModel
            .findById(id)
            .session(session)
            .populate({
                path: 'moderator',
                select: '_id username',
            })
            .populate({
                path: 'participants',
                select: '_id username',
            })
            .populate('subTasks parentTask files')
            .exec();
        if (!task) throw new NotFoundException('Task not found');
        return task;
    }
}