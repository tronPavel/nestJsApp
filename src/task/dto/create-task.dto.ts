import { IsArray, IsNotEmpty, IsOptional, IsString, Validate } from 'class-validator';

export class CreateTaskDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    participants: string[];

    @IsString()
    @IsNotEmpty()
    roomId: string;

    @IsString()
    @IsOptional()
    parentTaskId?: string;
}