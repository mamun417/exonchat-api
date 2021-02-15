import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import { ChatAgent } from '../../api/chat-agents/entities/chat-agent.entity';
import { SubscribersController } from '../../api/subscribers/subscribers.controller';
import { SubscribersService } from '../../api/subscribers/subscribers.service';

export default class CreateChatAgents implements Seeder {
    // constructor(private readonly subscribersService: SubscribersService) {}

    public async run(factory: Factory, connection: Connection): Promise<any> {
        console.log('\n ---------------Creating subscriber----------------');

        // const subscribers = await this.subscribersService.findAll();

        // console.log(subscribers);

        // await factory(ChatAgent)().createMany(5);
    }
}
