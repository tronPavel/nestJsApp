import { IsOptional, IsString, IsEnum } from 'class-validator';
import { MessageTags } from '../enums/message.tags';

export class UpdateMessageDto {
    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsEnum(MessageTags)
    tags?: MessageTags;
}