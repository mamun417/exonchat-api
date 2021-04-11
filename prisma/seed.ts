import { PrismaClient } from '@prisma/client';
import * as _f from 'faker';
import * as _l from 'lodash';
import { create } from 'node:domain';

const prisma = new PrismaClient();

enum permission_use_for_enum {
    subscriber,
    administrator,
}

async function main() {
    const roles: any = [
        {
            slug: 'super_admin',
            name: 'Super Admin',
            use_for: 'administrator',
            permissions: [{ slug: 'subscriber_list', name: 'Subscriber List', use_for: 'administrator' }],
        },
        {
            slug: 'admin',
            name: 'Admin',
            use_for: 'subscriber',
            permissions: [{ slug: 'agent_assign', name: 'Agent Assign', use_for: 'subscriber' }],
        },
        {
            slug: 'agent',
            name: 'Agent',
            use_for: 'subscriber',
            permissions: [{ slug: 'client_chat_join', name: 'Client Chat Join', use_for: 'subscriber' }],
        },
        {
            slug: 'user',
            name: 'User',
            use_for: 'subscriber',
            permissions: [{ slug: 'chat_join', name: 'Chat Join', use_for: 'subscriber' }],
        },
    ];

    const rolesData = await Promise.all(
        roles.map(async (role) => {
            return await prisma.role.create({
                data: {
                    slug: role.slug,
                    name: role.name,
                    use_for: role.use_for,
                    permissions: { create: role.permissions },
                },
            });
        }),
    );

    const subscriberData = await Promise.all(
        ['test', 'other'].map(async (namePart, key) => {
            await prisma.subscriber.create({
                data: {
                    company_name: namePart,
                    display_name: namePart,
                    api_key: namePart,
                    users: {
                        create: [
                            {
                                email: `${namePart}@${namePart}.${namePart}`,
                                password: '123',
                                role: {
                                    connect: {
                                        id: _l.find(rolesData, { slug: 'admin' }).id,
                                    },
                                },
                            },
                            {
                                email: `${namePart}1@${namePart}.${namePart}`,
                                password: '123',
                                role: {
                                    connect: {
                                        id: _l.find(rolesData, { slug: 'agent' }).id,
                                    },
                                },
                            },
                            {
                                email: `${namePart}2@${namePart}.${namePart}`,
                                password: '123',
                                role: {
                                    connect: {
                                        id: _l.find(rolesData, { slug: 'user' }).id,
                                    },
                                },
                            },
                        ],
                    },
                },
            });
        }),
    );
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
