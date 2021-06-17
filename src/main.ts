import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './exception/http-exception.filter';
import * as cookieParser from 'cookie-parser';
import { jwtConstants } from './auth/constants/constants';
import { RedisIoAdapter } from './adapters/redis-io-adapter';
import * as helmet from 'helmet';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use(helmet());
    app.use(cookieParser(jwtConstants.secret));
    app.useGlobalPipes(new ValidationPipe());
    app.enableCors({
        origin: [process.env.CLIENT_URL],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Accept', 'Content-Type', 'Access-Control-Allow-Headers', 'Authorization', 'X-Requested-With'],
        preflightContinue: true,
        optionsSuccessStatus: 204,
    });

    // app.useWebSocketAdapter(new RedisIoAdapter());

    // app.useGlobalFilters(new AllExceptionsFilter());
    await app.listen(3000);
}
bootstrap();
