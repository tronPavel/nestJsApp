import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document, ClientSession } from 'mongoose';
import { Task } from '../task/tasks.schema';
import { Thread } from '../threads/threads.schema';
import { Logger } from '@nestjs/common';

const logger = new Logger('ChatSchema');

@Schema()
export class Chat extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Task' })
    task: Types.ObjectId | Task;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Thread' }], default: [] })
    threads: (Types.ObjectId | Thread)[];
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

ChatSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    try {
        const session = this.$session();
        if (!session) {
            logger.error('Session is required for Chat deletion');
            throw new Error('Session is required for cascade deletion');
        }
        await this.model('Thread').deleteMany({ chat: this._id }, { session }).exec();
        next();
    } catch (error) {
        logger.error(`Failed to delete chat: ${error.message}`);
        next(error);
    }
});