import {IsString, IsOptional, IsArray, Validate} from 'class-validator';


export class UpdateRoomDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsArray()
    participants?: string[];
}

