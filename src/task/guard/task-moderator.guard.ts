/*
import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { TasksService } from '../tasks.service';

@Injectable()
export class TaskModeratorGuard implements CanActivate {
    constructor(private readonly tasksService: TasksService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const taskId = request.params.id;

        const task = await this.tasksService.findById(taskId);

        if (task.moderator._id.toString() !== user._id.toString()) {
            throw new HttpException('Only moderator allowed', HttpStatus.FORBIDDEN);
        }

        request.task = task;
        return true;
    }
}*/
// src/tasks/guards/task-moderator.guard.ts
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
export class TaskModeratorGuard implements CanActivate {
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
            .select('moderator')
            .exec();
        if (!task) {
            throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
        }

        if (task.moderator.toString() !== user._id.toString()) {
            throw new HttpException('Only moderator allowed', HttpStatus.FORBIDDEN);
        }

        return true; // Убрали req.task
    }
}
