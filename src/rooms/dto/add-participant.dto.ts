import {IsString, IsNotEmpty, Validate} from 'class-validator';
import {IsObjectIdConstraint} from "../../common/validator/is-object-id.validator";

export class AddParticipantDto {
    @IsNotEmpty()
    @IsString()
    @Validate(IsObjectIdConstraint)
    userId: string;
}