import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './exception/http-exception.filter';
import * as cookieParser from 'cookie-parser';
import { jwtConstants } from './auth/constants/constants';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use(cookieParser(jwtConstants.secret));
    app.useGlobalPipes(new ValidationPipe());
    app.enableCors({
        origin: ['http://localhost:8080'],
        credentials: true,
        preflightContinue: false,
    });

    // app.useGlobalFilters(new AllExceptionsFilter());
    await app.listen(3000);
}
bootstrap();
