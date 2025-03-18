import {Controller, Get, Param, UseGuards, Query} from '@nestjs/common';
import { ChatService } from './chat.service';
import {JwtAuthGuard} from "../auth/guards/jwt-auth.guard";
import {ChatHistoryDto} from "./dto/ChatHistoryDto";
import {Thread} from "../threads/threads.schema";
import {TaskParticipantGuard} from "../task/guard/task-participants.guard";
import {ChatAccessGuard} from "./guards/chat-access.guard";

@UseGuards(JwtAuthGuard, ChatAccessGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':id')
  async getChatHistory (
      @Param('id') id: string,
      @Query() chatHistoryDto:  ChatHistoryDto
  ): Promise<Thread[]> {
    return await this.chatService.getChatHistory(id, chatHistoryDto)
  }
}
