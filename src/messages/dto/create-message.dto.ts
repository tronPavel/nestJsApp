import {IsString, IsNotEmpty, IsOptional, IsEnum, Validate, IsArray} from 'class-validator';
import { MessageTags } from '../enums/message.tags';
import { IsObjectIdConstraint } from '../../common/validator/is-object-id.validator';

export class CreateMessageDto {
    @IsString()
    @IsNotEmpty()
    @Validate(IsObjectIdConstraint)
    threadId: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsOptional()
    @IsString()
    @IsEnum(MessageTags)
    tags?: MessageTags;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @Validate(IsObjectIdConstraint, { each: true })
    fileIds?: string[];

}