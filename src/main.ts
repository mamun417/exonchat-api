import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './exception/http-exception.filter';
import * as cookieParser from 'cookie-parser';
import { jwtConstants } from './auth/constants/constants';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe());
    // app.useGlobalFilters(new AllExceptionsFilter());
    await app.listen(3000);
    app.use(cookieParser());
}
bootstrap();
