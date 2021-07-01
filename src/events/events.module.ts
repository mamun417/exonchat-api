import { HttpModule, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { EventsGateway } from './events.gateway';
import { PrismaService } from '../prisma.service';

@Module({
    imports: [HttpModule, AuthModule],
    providers: [EventsGateway, PrismaService],
    exports: [EventsGateway],
})
export class EventsModule {}
