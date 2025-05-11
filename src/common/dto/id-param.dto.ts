import { IsNotEmpty, Validate } from 'class-validator';
import { IsObjectIdConstraint } from '../validator/is-object-id.validator';

export class IdParamDto {
    @IsNotEmpty()
    @Validate(IsObjectIdConstraint)
    id: string;
}