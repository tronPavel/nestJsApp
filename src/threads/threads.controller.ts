import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  UploadedFiles,
  BadRequestException, Delete, Param, Get, Query,
} from '@nestjs/common';
import { ThreadsService } from './threads.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TaskParticipantGuard } from '../task/guard/task-participants.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import {MessageAuthorGuard} from "../messages/guard/MessageAuthor.guard";
import {ThreadHistoryDto} from "./dto/history-thread.dto";
import {ChatAccessGuard} from "../chat/guards/chat-access.guard";
import {VerifiedUser} from "../auth/decarators/VerifiedUser.decarator";
import {User} from "../users/users.schema";

@UseGuards(JwtAuthGuard, ChatAccessGuard)
@Controller('threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Get(':id/history')
  async getThreadHistory(
      @Param('id') id: string,
      @Query() historyDto: ThreadHistoryDto,
  ) {
    return this.threadsService.getMessages(id, historyDto);
  }
}