import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    HttpException,
    HttpStatus,
    UsePipes,
    ValidationPipe,
    UseInterceptors,
    UploadedFiles,
} from '@nestjs/common';
import { PopulatedTask, TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TaskDto } from './dto/task.dto';
import { VerifiedUser } from '../auth/decarators/VerifiedUser.decarator';
import { User } from '../users/users.schema';
import { FilesInterceptor } from '@nestjs/platform-express';
import { TaskModeratorGuard } from './guard/task-moderator.guard';
import { TaskParticipantGuard } from './guard/task-participants.guard';
//import { TaskFromGuard } from './decorators/task.decorator';
import { RoomParticipantsGuard } from '../rooms/guard/room-participants.guard';
import { RoomModeratorGuard } from '../rooms/guard/room-moderator.guard';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
    constructor(private readonly taskService: TasksService) {}

    @UseGuards(TaskParticipantGuard)
    @Get(':id')
    //@Param('id') id: string
    //TaskDto
    async getTask(@Param('id') id: string): Promise<PopulatedTask> {
        return this.taskService.findById(id);
    }

    @Delete(':id')
    @UseGuards(TaskModeratorGuard, /*RoomModeratorGuard*/)
    async deleteTask(@Param('id') id: string) {
        return await this.taskService.delete(id);
    }

    @Post()
    //@UseGuards(RoomParticipantsGuard)
    @UseInterceptors(FilesInterceptor('files', 10))
    @UsePipes(new ValidationPipe({ transform: true }))
    async createTask(
        @Body() createTaskDto: CreateTaskDto,
        @VerifiedUser() user: User,
        @UploadedFiles() files: Express.Multer.File[],
    ): Promise<TaskDto> {
        //if (files.length && (!createTaskDto.fileTypes || createTaskDto.fileTypes.length !== files.length)) {
        // if (createTaskDto.fileTypes.length !== files.length) {
        //
        //     throw new HttpException('fileTypes must match the number of files', HttpStatus.BAD_REQUEST);
        // }
        console.log(createTaskDto);

        const task = await this.taskService.create(createTaskDto, user._id.toString(), files);
        return this.mapToTaskDto(task);
    }

    @Patch(':id')
    @UseGuards(TaskModeratorGuard, /*RoomModeratorGuard*/)
    @UseInterceptors(FilesInterceptor('files', 10))
    @UsePipes(new ValidationPipe({ transform: true }))
    async updateTask(
        @Param('id') id: string,
        @Body() updateTaskDto: UpdateTaskDto,
        @UploadedFiles() files: Express.Multer.File[],
    ): Promise<TaskDto> {
    /*    if (files.length && (!updateTaskDto.fileTypes || updateTaskDto.fileTypes.length !== files.length)) {
            throw new HttpException('fileTypes must match the number of files', HttpStatus.BAD_REQUEST);
        }*/
        const updatedTask = await this.taskService.update(id, updateTaskDto, files);
        return this.mapToTaskDto(updatedTask);
    }


    private mapToTaskDto(task: PopulatedTask): TaskDto {
        return {
            id: task._id.toString(),
            title: task.title,
            description: task.description,
            status: task.status,
            roomId: task.room,
            moderator: {
                id: task.moderator._id.toString(),
                username: task.moderator.username,
            },
            chatId: task.chat,
            participants: task.participants.map(p => ({
                id: p._id.toString(),
                username: p.username,
            })),
            files: task.files.map(file => ({
                id: file._id,
                name: file.name,
                size: file.size,
                type: file.type,
                mimetype: file.mimetype,
            })),
            parentTask: task.parentTask
                ? {
                    id: task.parentTask._id.toString(),
                    title: task.parentTask.title,
                    status: task.parentTask.status,
                }
                : undefined,
            subTasks: task.subTasks?.map(sub => ({
                id: sub._id.toString(),
                title: sub.title,
                status: sub.status,
            })),
        };
    }
}