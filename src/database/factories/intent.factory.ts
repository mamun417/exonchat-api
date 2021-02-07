import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import { Intents } from '../entity/intent.entity';

define(Intents, (faker: typeof Faker) => {
    const intent = new Intents();

    intent.tag = faker.lorem.word(); // required
    intent.subscriber_id = faker.random.boolean()
        ? faker.random.number()
        : null;
    intent.ai_id = faker.random.number();
    intent.confidence1 = faker.random.number({
        min: 0,
        max: 1,
        precision: 0.0001,
    });
    intent.description = faker.lorem.sentence();
    intent.parent_id = faker.random.number();

    return intent;
});
