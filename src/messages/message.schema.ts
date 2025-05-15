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

MessageSchema.index({ thread: 1 });

async function handleMessageDeletion(query: any, documents: any[], session: ClientSession | null, next: (err?: any) => void) {
    try {
        if (!session) {
            logger.error('Session is required for Message deletion');
            throw new Error('Session is required for cascade deletion');
        }
        const fileIds = documents.flatMap(doc => doc.files);
        if (fileIds.length > 0) {
            const FileModel = query.model.db.model('File');
            await FileModel.bulkWrite(
                fileIds.map(id => ({ deleteOne: { filter: { _id: id } } })),
                { session }
            );
            await query.model.db.collection('taskFiles.chunks').bulkWrite(
                fileIds.map(id => ({ deleteMany: { filter: { files_id: id } } })),
                { session }
            );
            logger.log(`Deleted ${fileIds.length} files for ${documents.length} messages`);
        } else {
            logger.log(`No files to delete for ${documents.length} messages`);
        }
        next();
    } catch (error) {
        logger.error(`Failed to delete files for messages: ${error.message}`);
        next(error);
    }
}

MessageSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    await handleMessageDeletion(this, [this], this.$session(), next);
});

MessageSchema.pre('deleteMany', { query: true }, async function (next) {
    const session = this.getOptions().session || null;
    const messages = await this.model.find(this.getFilter()).session(session).exec();
    await handleMessageDeletion(this, messages, session, next);
});