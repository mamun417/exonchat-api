import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import CreateChatClients from './chat_client';
import CreateConversations from './conversation';
import CreateMessages from './message';

export default class CreateDatabase implements Seeder {
    public async run(factory: Factory, connection: Connection): Promise<any> {
        // await factory(ChatClient)().createMany(1);
        await new CreateMessages().run(factory, connection);
        await new CreateConversations(1).run(factory, connection);
        await new CreateChatClients().run(factory, connection);
    }
}
