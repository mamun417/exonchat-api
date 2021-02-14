import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import CreateConversations from './conversation';
import CreateMessages from './message';
import CreateSubscribers from './subscriber';
import CreateChatAgents from './chat-agent';

export default class CreateDatabase implements Seeder {
    public async run(factory: Factory, connection: Connection): Promise<any> {
        await new CreateSubscribers().run(factory, connection);
        await new CreateChatAgents().run(factory, connection);
        // await new CreateMessages().run(factory, connection);
        // await new CreateConversations().run(factory, connection);
        // await new CreateChatClients().run(factory, connection);
    }
}
