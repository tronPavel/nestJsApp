import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'fs.files' })
export class File extends Document {
    @Prop({ required: true })
    filename: string;

    @Prop({ required: true })
    length: number;

    @Prop({ required: true, enum: ['image', 'video', 'file'] })
    type: 'image' | 'video' | 'file';

    @Prop({ required: true })
    mimetype: string;
}

export const FileSchema = SchemaFactory.createForClass(File);

FileSchema.index({ type: 1 });