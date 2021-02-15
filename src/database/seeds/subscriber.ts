import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import { Subscriber } from '../../api/subscribers/entities/subscriber.entity';

export default class CreateSubscribers implements Seeder {
    public async run(factory: Factory, connection: Connection): Promise<any> {
        console.log('\n ---------------Creating subscriber----------------');
        // return await factory(Subscriber)().createMany(5);
    }
}
