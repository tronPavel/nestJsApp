import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RoomFromGuard = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.room;
    },
);
