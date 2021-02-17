import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import { ConversationClient } from '../../api/conversation-clients/entities/conversation-client.entity';

define(ConversationClient, (faker: typeof Faker) => {
    return new ConversationClient();
});
