import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import { Message } from '../../api/messages/entities/message.entity';

export default class CreateMessages implements Seeder {
    public async run(factory: Factory, connection: Connection): Promise<any> {
        await factory(Message)().createMany(10);
    }
}
