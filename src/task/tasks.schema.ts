import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../users/users.schema';
import { Room } from '../rooms/rooms.schema';
import { Chat } from '../chat/chat.schema';
import { File } from '../files/file.schema';
import { TaskStatus } from './enums/task-status.enum';

@Schema({ timestamps: true })
export class Task extends Document {
    @Prop({ required: true })
    title: string;

    @Prop()
    description: string;

    @Prop({ required: true, enum: TaskStatus })
    status: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    moderator: Types.ObjectId | User;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true })
    participants: (Types.ObjectId | User)[];

    @Prop({ type: [{ type: Types.ObjectId, ref: 'File' }], default: [] })
    files: (Types.ObjectId | File)[];

    @Prop({ type: Types.ObjectId, ref: 'Chat', required: true })
    chat: Types.ObjectId | Chat;

    @Prop({ type: Types.ObjectId, ref: 'Task' })
    parentTask?: Types.ObjectId | Task;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Task' }], default: [] })
    subTasks?: (Types.ObjectId | Task)[];

    @Prop({ type: Types.ObjectId, ref: 'Room', required: true })
    room: Types.ObjectId | Room;
}

export const TasksSchema = SchemaFactory.createForClass(Task);

// TasksSchema.index({ room: 1, status: 1 });
// TasksSchema.index({ chat: 1 });
// TasksSchema.index({ parentTask: 1 });
// TasksSchema.index({ participants: 1 });