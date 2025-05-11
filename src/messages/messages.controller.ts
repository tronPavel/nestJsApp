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

  /*@Post()
  @UseInterceptors(FilesInterceptor('files', 10))
  @UsePipes(new ValidationPipe({ transform: true }))
  async createMessage(@Body() dto: CreateMessageDto, @UploadedFiles() files: Express.Multer.File[], @Request() req) {
    if (files?.length > 10) {
      throw new BadRequestException('Too many files (max 10)');
    }
    const userId = req.user.sub; // Предполагается, что JWT содержит sub с ID пользователя
    return this.messageService.create(dto, userId, files);
  }
  @Patch(':id')
  async updateMessage(
      @Param('id') id: string,
      @Body() updateMessageDto: UpdateMessageDto,
  ) {
    return this.messageService.update(id, updateMessageDto);
  }
  @UseGuards(MessageAuthorGuard)
  @Delete(':id')
  async deleteMessage(@Param('id') id: string) {
    return await this.messageService.delete(id);
  }*/
}