import { HttpModule, Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@Module({
    imports: [HttpModule],
    providers: [EventsGateway],
})
export class EventsModule {}
