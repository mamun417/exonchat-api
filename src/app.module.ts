import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { EventsModule } from './events/events.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageModule } from './api/message/message.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRoot(),
        // MongooseModule.forRoot('mongodb://localhost/exonchat'),
        EventsModule,
        MessageModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
