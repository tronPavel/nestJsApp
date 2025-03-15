import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, ClientSession } from 'mongoose';
import { MessageTags } from './enums/message.tags';
import { Logger } from '@nestjs/common';
import { File } from '../files/file.schema';

const logger = new Logger('MessageSchema');

@Schema({ timestamps: true })
export class Message extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Thread', required: true })
    thread: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    sender: Types.ObjectId;

    @Prop({ required: true })
    content: string;

    @Prop({ enum: MessageTags })
    tags?: string;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'File' }], default: [] })
    files: (Types.ObjectId | File)[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);

