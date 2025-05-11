import {IsString, IsNotEmpty, ValidateNested, Validate} from 'class-validator';
import { Type } from 'class-transformer';
import {IsObjectIdConstraint} from "../../common/validator/is-object-id.validator";

class ModeratorDto {
    @IsNotEmpty()
    @IsString()
    @Validate(IsObjectIdConstraint)
    id: string;

    @IsNotEmpty()
    @IsString()
    username: string;
}

class ParticipantDto {
    @IsNotEmpty()
    @IsString()
    @Validate(IsObjectIdConstraint)
    id: string;

    @IsNotEmpty()
    @IsString()
    username: string;
}

class TaskDto {
    @IsNotEmpty()
    @IsString()
    @Validate(IsObjectIdConstraint)
    id: string;

    @IsNotEmpty()
    @IsString()
    title: string;
}

export class RoomDto {
    @IsNotEmpty()
    @IsString()
    @Validate(IsObjectIdConstraint)
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