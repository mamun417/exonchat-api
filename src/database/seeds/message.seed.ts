import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import { Messages } from '../../api/message/message.entity';

export default class CreateMessages implements Seeder {
    public async run(factory: Factory, connection: Connection): Promise<any> {
        await factory(Messages)().createMany(10);
    }
}
