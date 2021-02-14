import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import {
    ChatClient,
    ChatClientTypes,
} from '../../api/chat-clients/entities/chat-client.entity';

define(ChatClient, (faker: typeof Faker) => {
    const chatClient = new ChatClient();

    chatClient.info = JSON.stringify({
        key_name: faker.lorem.sentence(),
    });

    chatClient.host_log = JSON.stringify({
        key_name: faker.lorem.sentence(),
    });

    chatClient.init_name = faker.name.findName();

    const chatClientTypes = ['CLIENT', 'AGENT', 'ADMIN'];

    chatClient.type =
        ChatClientTypes[faker.random.arrayElement(chatClientTypes)];

    chatClient.identifier = faker.lorem.word();
    chatClient.init_email = faker.internet.email();
    chatClient.agent_id = faker.random.uuid();
    chatClient.subscriber_id = faker.random.uuid();

    return chatClient;
});
