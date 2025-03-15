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

