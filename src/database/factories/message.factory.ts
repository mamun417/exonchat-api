import * as Faker from 'faker';
import { define, factory } from 'typeorm-seeding';
import { Message } from '../../api/messages/entities/message.entity';
import { Conversation } from '../../api/conversations/entities/conversation.entity';

define(Message, (faker: typeof Faker) => {
    const message = new Message();

    message.msg = faker.lorem.sentences();
    message.sender = faker.lorem.word();
    message.sender_type = faker.lorem.word();

    return message;
});
