import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import { ChatAgent } from '../../api/chat-agents/entities/chat-agent.entity';
import { Permission } from '../../api/role-permissions/entities/permission.entity';

define(Permission, (faker: typeof Faker) => {
    const permission = new Permission();

    permission.slug = faker.helpers.slugify(faker.company.companyName());
    permission.name = faker.company.companyName();
    permission.description = faker.lorem.text();

    return permission;
});
