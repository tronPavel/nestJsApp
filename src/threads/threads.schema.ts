import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document, ClientSession } from 'mongoose';
import { Chat } from '../chat/chat.schema';
import { Message } from '../messages/message.schema';
import { Logger } from '@nestjs/common';

const logger = new Logger('ThreadSchema');

@Schema({ timestamps: true })
export class Thread extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Chat', required: true })
    chat: Types.ObjectId | Chat;

    @Prop({ type: Types.ObjectId, ref: 'Message' })
    mainMessage: Types.ObjectId | Message;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Message' }], default: [] })
    replies: (Types.ObjectId | Message)[];
}

export const ThreadSchema = SchemaFactory.createForClass(Thread);
