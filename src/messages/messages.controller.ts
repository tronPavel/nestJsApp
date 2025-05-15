import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Request, Param, Delete, Patch,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MessageService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TaskParticipantGuard } from '../task/guard/task-participants.guard';
import {MessageAuthorGuard} from "./guard/MessageAuthor.guard";
import {UpdateMessageDto} from "./dto/update-message.dto";
import {ChatAccessGuard} from "../chat/guards/chat-access.guard";

@UseGuards(JwtAuthGuard, ChatAccessGuard)
@Controller('messages')
export class MessageController {
  constructor(private messageService: MessageService) {}

}