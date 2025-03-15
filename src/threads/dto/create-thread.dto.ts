import {IsNotEmpty, IsString, IsOptional, IsEnum, Validate, IsArray} from 'class-validator';
import { MessageTags } from '../../messages/enums/message.tags';
import { IsObjectIdConstraint } from '../../common/validator/is-object-id.validator';

export class CreateThreadDto {
    @IsNotEmpty()
    @IsString()
    @Validate(IsObjectIdConstraint)
    chatId: string;

    @IsNotEmpty()
    @IsString()
    mainMessage: string;

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