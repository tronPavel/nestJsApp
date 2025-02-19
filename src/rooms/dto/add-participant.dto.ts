import {IsString, IsNotEmpty, Validate} from 'class-validator';

export class AddParticipantDto {
    @IsNotEmpty()
    @IsString()
    userId: string;
}