import {IsString, IsNotEmpty, ValidateNested, Validate} from 'class-validator';
import { Type } from 'class-transformer';

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

class TaskDto {
    @IsNotEmpty()
    @IsString()
    id: string;

    @IsNotEmpty()
    @IsString()
    title: string;
}

export class RoomDto {
    @IsNotEmpty()
    @IsString()
    id: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @ValidateNested()
    @Type(() => ModeratorDto)
    moderator: ModeratorDto;

    @ValidateNested({ each: true })
    @Type(() => ParticipantDto)
    participants: ParticipantDto[];

    @ValidateNested({ each: true })
    @Type(() => TaskDto)
    tasks: TaskDto[];
}