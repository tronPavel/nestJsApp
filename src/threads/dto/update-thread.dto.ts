import { IsOptional, IsString, IsEnum } from 'class-validator';
import { MessageTags } from '../../messages/enums/message.tags';

export class UpdateThreadDto {
    @IsOptional()
    @IsString()
    mainMessage?: string;

    @IsOptional()
    @IsEnum(MessageTags)
    tags?: MessageTags;
}