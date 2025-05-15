import {
    Injectable,
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task } from '../tasks.schema';

@Injectable()
export class TaskParticipantGuard implements CanActivate {
    constructor(
        @InjectModel(Task.name) private readonly taskModel: Model<Task>,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const user = req.user;
        const taskId = req.params.id;

        if (!Types.ObjectId.isValid(taskId)) {
            throw new HttpException('Invalid task ID', HttpStatus.BAD_REQUEST);
        }

        const task = await this.taskModel
            .findById(taskId)
            .select('participants')
            .exec();
        console.log(task)
        if (!task) {
            throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
        }

        const isParticipant = task.participants
            .map(p => p.toString())
            .includes(user._id.toString());

        if (!isParticipant) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }

        return true;
    }
}
