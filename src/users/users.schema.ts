import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
    @Prop({ unique: true, required: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ unique: true, required: true })
    username: string;

    @Prop()
    token: string;

    @Prop()
    expiresIn: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
