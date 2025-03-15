import {Controller, Get, Param, UseGuards, Query} from '@nestjs/common';
import { ChatService } from './chat.service';
import {JwtAuthGuard} from "../auth/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}


}
