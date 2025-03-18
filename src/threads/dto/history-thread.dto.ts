import {IsNotEmpty, IsPositive, Max} from 'class-validator';

export class ThreadHistoryDto {
    @IsNotEmpty()
    @IsPositive()
    page: number;

    @IsNotEmpty()
    @IsPositive()
    @Max(100)
    limit: number;
}