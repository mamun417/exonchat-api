import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import { Conversation } from '../../api/conversations/entities/conversation.entity';

export default class CreateConversations implements Seeder {
    public async run(factory: Factory, connection: Connection): Promise<any> {
        await factory(Conversation)().createMany(1);
    }
}
