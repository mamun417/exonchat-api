import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import { Conversation } from '../../api/conversations/entities/conversation.entity';

define(Conversation, (faker: typeof Faker) => {
    const conversation = new Conversation();

    conversation.agents_only = faker.random.uuid();
    conversation.subscriber_id = faker.random.uuid();
    conversation.type = faker.lorem.word();
    conversation.close_by_id = faker.random.uuid();

    return conversation;
});
