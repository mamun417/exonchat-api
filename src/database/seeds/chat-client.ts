import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import { ChatClient } from '../../api/chat-clients/entities/chat-client.entity';

export default class CreateChatClients implements Seeder {
    public async run(factory: Factory, connection: Connection): Promise<any> {
        console.log('\n ---------------Creating chat client----------------');

        await factory(ChatClient)().createMany(1);
    }
}
