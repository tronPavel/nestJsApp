import { IsString, IsNotEmpty } from 'class-validator';

export class CreateRoomDto {
    @IsNotEmpty()
    @IsString()
    name: string;
}
