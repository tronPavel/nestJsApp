import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../users/users.schema';
import { Task } from '../task/tasks.schema';

@Schema({ timestamps: true })
export class Room extends Document{
    @Prop({ required: true })
    name: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    moderator: Types.ObjectId | User;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true })
    participants: (Types.ObjectId | User)[];

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Task' }], default: [] })
    tasks: (Types.ObjectId | Task)[];
}

export const RoomSchema = SchemaFactory.createForClass(Room);

