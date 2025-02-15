import {IsString} from "class-validator";

//TODO пересмотреть дто, возможно лишние, мб потом расширятся
export class CollaboratorDto {
    @IsString()
    id: string;

    @IsString()
    username: string;
}