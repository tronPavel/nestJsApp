import { IsNotEmpty, IsInt, IsPositive, Max } from 'class-validator';

export class ChatHistoryDto {
    @IsNotEmpty()
    @IsInt()
    @IsPositive()
    page: number;

    @IsNotEmpty()
    @IsInt()
    @IsPositive()
    @Max(100)
    limit: number;
}