import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { File, FileSchema } from './file.schema';
import { FileService } from './file.service';
import { FileController } from './files.controller';
import {TasksModule} from "../task/tasks.module";
import {ChatModule} from "../chat/chat.module";

@Module({
    imports: [
        MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]),
        forwardRef(() => TasksModule),
        ChatModule
    ],
    providers: [FileService],
    controllers: [FileController],
    exports: [FileService],
})
export class FileModule {}
