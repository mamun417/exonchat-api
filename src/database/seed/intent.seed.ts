// create-pets.seed.ts
import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import { Intents } from '../entity/intent.entity';

export default class CreateIntents implements Seeder {
    public async run(factory: Factory, connection: Connection): Promise<any> {
        await factory(Intents)().createMany(1000);
    }
}
