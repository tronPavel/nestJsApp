import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import * as multer from 'multer';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Настройка middleware
    app.use(cookieParser());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Включение CORS
    app.enableCors({
        credentials: true,
    });

    await app.listen(3000);
}
bootstrap();