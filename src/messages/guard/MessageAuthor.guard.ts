import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from '../message.schema';
import { Thread } from '../../threads/threads.schema';

@Injectable()
export class MessageAuthorGuard implements CanActivate {
    constructor(
        @InjectModel(Message.name) private messageModel: Model<Message>,
        @InjectModel(Thread.name) private threadModel: Model<Thread>
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const userId = req.user.sub;
        const messageId = req.params.id;
        if (req.url.includes('/messages')) {
            const message = await this.messageModel
                .findById(messageId)
                .populate('thread')
                .exec();
            if (!message) {
                throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
            }
            if (message.sender.toString() !== userId) {
                throw new HttpException('You are not the author of this message', HttpStatus.FORBIDDEN);
            }
        }
        else if (req.url.includes('/threads')) {
            const thread = await this.threadModel
                .findById(messageId)
                .populate('mainMessage')
                .exec();
            if (!thread) {
                throw new HttpException('Thread not found', HttpStatus.NOT_FOUND);
            }
            const mainMessage = thread.mainMessage as any;
            if (!mainMessage || mainMessage.sender.toString() !== userId) {
                throw new HttpException('You are not the author of this thread', HttpStatus.FORBIDDEN);
            }
        } else {
            throw new HttpException('Invalid request URL', HttpStatus.BAD_REQUEST);
        }

        return true;
    }
}