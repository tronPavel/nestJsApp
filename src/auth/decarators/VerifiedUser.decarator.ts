import {createParamDecorator, ExecutionContext, UnauthorizedException} from '@nestjs/common';

const getCurrentUserByContext = (context: ExecutionContext) => {
    const user = context.switchToHttp().getRequest().user;
    if (!user) throw new UnauthorizedException('User not authenticated');
    return user;
};

export const VerifiedUser = createParamDecorator(
    (_data: unknown, context: ExecutionContext) =>
        getCurrentUserByContext(context),
);
