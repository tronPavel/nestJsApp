import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { TaskStatus } from '../enums/task-status.enum';

export class UpdateTaskDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(TaskStatus)
    @IsOptional()
    status?: TaskStatus;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    participantsToAdd?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    participantsToRemove?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    fileIdsToRemove?: string[];
}