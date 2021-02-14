import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import { ChatAgent } from '../../api/chat-agents/entities/chat-agent.entity';

define(ChatAgent, (faker: typeof Faker) => {
    const chatAgent = new ChatAgent();

    chatAgent.email = faker.internet.email();
    chatAgent.password = faker.internet.password();
    chatAgent.active = faker.random.boolean();

    return chatAgent;
});
