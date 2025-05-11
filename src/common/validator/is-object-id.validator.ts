import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { Types } from 'mongoose';

@ValidatorConstraint({ name: 'isObjectId', async: false })
export class IsObjectIdConstraint implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        return typeof value === 'string' && Types.ObjectId.isValid(value);
    }

    defaultMessage(args: ValidationArguments) {
        return `${args.property} must be a valid ObjectId`;
    }
}