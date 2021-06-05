import { HttpModule, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { EventsGateway } from './events.gateway';

@Module({
    imports: [HttpModule, AuthModule],
    providers: [EventsGateway],
    exports: [EventsGateway],
})
export class EventsModule {}
