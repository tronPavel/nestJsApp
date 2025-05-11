import { IsArray, IsNotEmpty, IsOptional, IsString, Validate } from 'class-validator';
import { IsObjectIdConstraint } from '../../common/validator/is-object-id.validator';

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
    @Validate(IsObjectIdConstraint)
    roomId: string;

    @IsString()
    @IsOptional()
    @Validate(IsObjectIdConstraint)
    parentTaskId?: string;
}