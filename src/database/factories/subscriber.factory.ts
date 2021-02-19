import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import { Subscriber } from '../../api/subscribers/entities/subscriber.entity';

define(Subscriber, (faker: typeof Faker) => {
    const subscriber = new Subscriber();

    subscriber.email = faker.internet.email();
    subscriber.password = faker.internet.password();
    subscriber.active = faker.random.boolean();
    subscriber.api_key = faker.random.word();

    return subscriber;
});
