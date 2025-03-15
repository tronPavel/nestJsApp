import {
    Controller,
    Get,
    Post,
    Param,
    Res,
    Body,
    UploadedFiles,
    UseInterceptors,
    BadRequestException,
    UseGuards,
    Headers, UsePipes, ValidationPipe,
} from '@nestjs/common';
import { FileService } from './file.service';
import { Response } from 'express';
import {AnyFilesInterceptor, FilesInterceptor} from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TaskParticipantGuard } from '../task/guard/task-participants.guard';
import {ChatAccessGuard} from "../chat/guards/chat-access.guard";

@UseGuards(JwtAuthGuard, ChatAccessGuard)
@Controller('files')
export class FileController {
    constructor(private readonly fileService: FileService) {}

  /*  @Post('upload')
/!*    @UseInterceptors(FilesInterceptor('files', 10, {
        limits: { fileSize: 10 * 1024 * 1024 }, // 10 МБ
        preservePath: true, // Важно для совместимости с текстовыми полями
    }))*!/
    @UseInterceptors(AnyFilesInterceptor())
    @UsePipes(new ValidationPipe({ transform: true }))
    async uploadFiles(
        @UploadedFiles() files: Express.Multer.File[],
       @Body() body: { chatId: string } // Получаем весь body
    ) {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files uploaded');
        }

        const fileIds = await Promise.all(
            files.map(file => this.fileService.uploadFile(file))
        );
        return { fileIds };
    }*/
    @Post('upload/:chatId')
    @UseInterceptors(FilesInterceptor('files', 10))
    async uploadFiles(
        @UploadedFiles() files: Express.Multer.File[],
        @Param('chatId') chatId: string,
    ) {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files uploaded');
        }
        if (!chatId) {
            throw new BadRequestException('chatId is required');
        }

        const fileIds = await Promise.all(
            files.map(file => this.fileService.uploadFile(file))
        );
        return { fileIds, chatId };
    }

    @Get(':id/stream')
    async streamFile(@Param('id') fileId: string, @Res() res: Response, @Headers('range') range: string) {
        await this.fileService.getFileStream(fileId, res, range);
    }

    @Get(':id/download')
    async downloadFile(@Param('id') fileId: string, @Res() res: Response) {
        await this.fileService.downloadFile(fileId, res);
    }

    @Get(':id/metadata')
    async getFileMetadata(@Param('id') fileId: string) {
        return this.fileService.getFileMetadata(fileId);
    }
}