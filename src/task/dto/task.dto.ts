import { IsString, IsOptional, IsEnum, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskStatus } from '../enums/task-status.enum';

class ModeratorDto {
    @IsNotEmpty()
    @IsString()
    id: string;

    @IsNotEmpty()
    @IsString()
    username: string;
}

class ParticipantDto {
    @IsNotEmpty()
    @IsString()
    id: string;

    @IsNotEmpty()
    @IsString()
    username: string;
}

class SubTaskDto {
    @IsNotEmpty()
    @IsString()
    id: string;

    @IsNotEmpty()
    @IsString()
    title: string;

    @IsNotEmpty()
    @IsString()
    status: string;
}

class ParentTaskDto {
    @IsNotEmpty()
    @IsString()
    id: string;

    @IsNotEmpty()
    @IsString()
    title: string;

    @IsNotEmpty()
    @IsString()
    status: string;
}

class FileDto {
    @IsNotEmpty()
    @IsString()
    id: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    size: number;

    @IsNotEmpty()
    @IsString()
    type: string;

    @IsNotEmpty()
    @IsString()
    mimetype: string;
}

export class TaskDto {
    @IsNotEmpty()
    @IsString()
    id: string;

    @IsNotEmpty()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNotEmpty()
    @IsString()
    @IsEnum(TaskStatus)
    status: string;

    @ValidateNested()
    @Type(() => ModeratorDto)
    moderator: ModeratorDto;

    @ValidateNested({ each: true })
    @Type(() => ParticipantDto)
    participants: ParticipantDto[];

    @ValidateNested({ each: true })
    @Type(() => SubTaskDto)
    @IsOptional()
    subTasks?: SubTaskDto[];

    @ValidateNested()
    @Type(() => ParentTaskDto)
    @IsOptional()
    parentTask?: ParentTaskDto;

    @IsNotEmpty()
    @IsString()
    chatId: string;

    @IsNotEmpty()
    @IsString()
    roomId: string;

    @ValidateNested({ each: true })
    @Type(() => FileDto)
    @IsOptional()
    files?: FileDto[];
}