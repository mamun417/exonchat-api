import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { EventsModule } from './events/events.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRoot({
            type: 'mysql',
            host: 'localhost',
            port: 3306,
            username: 'root',
            password: '1230',
            database: 'exonchat',
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            migrationsTableName: 'migrations',
            migrations: ['migration/*.ts'],
            cli: {
                migrationsDir: 'migration',
            },
            synchronize: true,
        }),
        // MongooseModule.forRoot('mongodb://localhost/exonchat'),
        EventsModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
