import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Messages } from './message.entity';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Messages])],
    providers: [MessageService],
    controllers: [MessageController],
})
export class MessageModule {}
