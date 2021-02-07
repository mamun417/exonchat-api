import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import { Messages } from '../../api/message/message.entity';

define(Messages, (faker: typeof Faker) => {
    const message = new Messages();

    message.conversation_id = faker.random.number();
    message.msg = faker.lorem.sentences();
    message.sender = faker.lorem.word();
    message.sender_type = faker.lorem.word();

    return message;
});
