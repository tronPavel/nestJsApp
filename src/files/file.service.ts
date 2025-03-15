import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, ClientSession, Model, Types } from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { File } from './file.schema';
import { Response } from 'express';

@Injectable()
export class FileService {
    private bucket: GridFSBucket;

    constructor(
        @InjectConnection() private connection: Connection,
        @InjectModel(File.name) private fileModel: Model<File>
    ) {
        this.bucket = new GridFSBucket(this.connection.db, { bucketName: 'taskFiles' });
    }

    async uploadFile(file: Express.Multer.File, session?: ClientSession): Promise<string> {
        const type = this.determineFileType(file.mimetype);

        // Допустимые MIME-типы
        const allowedTypes = {
            image: ['image/jpeg', 'image/png', 'image/gif'],
            video: ['video/mp4', 'video/mpeg', 'video/webm'],
            file: [
                'application/pdf',
                'text/plain',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ],
        };

        const isValidType =
            allowedTypes.image.includes(file.mimetype) ||
            allowedTypes.video.includes(file.mimetype) ||
            allowedTypes.file.includes(file.mimetype);
        if (!isValidType) {
            throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
        }

        const maxSize = 100 * 1024 * 1024; // 100 MB
        if (file.size > maxSize) {
            throw new BadRequestException(`File too large. Max size: ${maxSize / 1024 / 1024}MB`);
        }

        const fileId = new Types.ObjectId();
        const uploadStream = this.bucket.openUploadStreamWithId(fileId, file.originalname);

        // Используем stream, если доступен, иначе buffer
        await new Promise<void>((resolve, reject) => {
            const stream = file.stream || (file.buffer ? require('stream').Readable.from(file.buffer) : null);
            if (!stream) {
                reject(new BadRequestException('File stream or buffer is unavailable'));
                return;
            }

            stream.pipe(uploadStream)
                .on('finish', () => resolve())
                .on('error', (error) => reject(error));
        });

        const fileDoc = new this.fileModel({
            _id: fileId,
            filename: file.originalname,
            length: file.size,
            type,
            mimetype: file.mimetype,
        });

        await fileDoc.save({ session });

        return fileId.toString();
    }

    private determineFileType(mimetype: string): 'image' | 'video' | 'file' {
        if (mimetype.startsWith('image/')) return 'image';
        if (mimetype.startsWith('video/')) return 'video';
        return 'file';
    }

    async deleteFile(fileId: string, session?: ClientSession): Promise<void> {
        const objectId = new Types.ObjectId(fileId);
        await Promise.all([
            this.fileModel.deleteOne({ _id: objectId }, { session }).exec(),
            this.connection.db.collection('taskFiles.chunks').deleteMany({ files_id: objectId }, { session }),
        ]);
    }

    async getFileMetadata(fileId: string): Promise<{ id: string; name: string; size: number; type: string; mimetype: string }> {
        const file = await this.fileModel.findById(fileId).exec();
        if (!file) throw new NotFoundException('File not found');
        return {
            id: file._id.toString(),
            name: file.filename,
            size: file.length,
            type: file.type,
            mimetype: file.mimetype,
        };
    }

    async getFileStream(fileId: string, res: Response, range?: string): Promise<void> {
        const file = await this.fileModel.findById(fileId).exec();
        if (!file) throw new NotFoundException('File not found');

        const fileSize = file.length;
        const objectId = new Types.ObjectId(fileId);

        if (range) {
            const match = range.match(/^bytes=(\d+)-(\d*)$/);
            if (!match) throw new BadRequestException('Invalid range header');

            const start = parseInt(match[1], 10);
            const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

            if (start >= fileSize || end >= fileSize || start > end) {
                throw new BadRequestException('Invalid range');
            }

            const chunkSize = end - start + 1;

            res.status(206);
            res.set({
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize.toString(),
                'Content-Type': file.mimetype,
                'Content-Disposition': 'inline',
            });

            const downloadStream = this.bucket.openDownloadStream(objectId, { start, end: end + 1 });
            downloadStream.pipe(res as any);
        } else {
            res.set({
                'Content-Length': fileSize.toString(),
                'Content-Type': file.mimetype,
                'Content-Disposition': 'inline',
            });
            const downloadStream = this.bucket.openDownloadStream(objectId);
            downloadStream.pipe(res as any);
        }
    }

    async downloadFile(fileId: string, res: Response): Promise<void> {
        const file = await this.fileModel.findById(fileId).exec();
        if (!file) throw new NotFoundException('File not found');

        res.set({
            'Content-Type': file.mimetype,
            'Content-Disposition': `attachment; filename="${file.filename}"`,
        });

        const downloadStream = this.bucket.openDownloadStream(new Types.ObjectId(fileId));
        downloadStream.pipe(res as any);
    }
}