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

ThreadSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    try {
        const session = this.$session();
        if (!session) {
            logger.error('Session is required for Thread deletion');
            throw new Error('Session is required for cascade deletion');
        }
        const messageIds = [this.mainMessage, ...this.replies];
        await Promise.all([
            this.model('Message').deleteMany({ _id: { $in: messageIds } }, { session }).exec(),
            this.model('Chat').updateOne(
                { _id: this.chat },
                { $pull: { threads: this._id } },
                { session }
            ).exec(),
        ]);
        next();
    } catch (error) {
        logger.error(`Failed to delete thread: ${error.message}`);
        next(error);
    }
});

ThreadSchema.pre('deleteMany', { query: true }, async function (next) {
    try {
        const session = this.getOptions().session || null;
        if (!session) {
            logger.error('Session is required for Thread deletion');
            throw new Error('Session is required for cascade deletion');
        }
        const threads = await this.model.find(this.getFilter()).session(session).exec();
        const messageIds = threads.flatMap(doc => [doc.mainMessage, ...doc.replies]);
        await this.model.db.model('Message').deleteMany({ _id: { $in: messageIds } }, { session }).exec();
        next();
    } catch (error) {
        logger.error(`Failed to delete threads: ${error.message}`);
        next(error);
    }
});