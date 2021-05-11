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

    const subscriptions = await Promise.all([
        await prisma.subscription.create({
            data: {
                slug: 'free',
                display_name: 'Free',
                one_day_price: 0,
                active: true,
            },
        }),
    ]);

    const subscriberData = await Promise.all(
        ['test', 'other'].map(async (namePart, key) => {
            const subscriber = await prisma.subscriber.create({
                data: {
                    company_name: namePart,
                    display_name: namePart,
                    api_key: namePart,
                    active: true,
                    users: {
                        create: [
                            {
                                email: `${namePart}@${namePart}.${namePart}`,
                                password: '123',
                                active: true,
                                role: {
                                    connect: {
                                        id: _l.find(rolesData, { slug: 'admin' }).id,
                                    },
                                },
                                user_meta: {
                                    create: {
                                        display_name: namePart,
                                        full_name: namePart,
                                    },
                                },
                            },
                            {
                                email: `${namePart}1@${namePart}.${namePart}`,
                                password: '123',
                                active: true,
                                role: {
                                    connect: {
                                        id: _l.find(rolesData, { slug: 'agent' }).id,
                                    },
                                },
                                user_meta: {
                                    create: {
                                        display_name: namePart,
                                        full_name: namePart,
                                    },
                                },
                            },
                            {
                                email: `${namePart}2@${namePart}.${namePart}`,
                                password: '123',
                                active: true,
                                role: {
                                    connect: {
                                        id: _l.find(rolesData, { slug: 'user' }).id,
                                    },
                                },
                                user_meta: {
                                    create: {
                                        display_name: namePart,
                                        full_name: namePart,
                                    },
                                },
                            },
                        ],
                    },
                    subscriber_subscription: {
                        create: {
                            subscription: { connect: { id: subscriptions[0].id } },
                        },
                    },
                },
            });

            await Promise.all(
                ['any', 'support', 'technical'].map(async (tp, key) => {
                    await prisma.chat_department.create({
                        data: {
                            tag: tp,
                            description: tp,
                            subscriber_id: subscriber.id,
                        },
                    });
                }),
            );
        }),
    );

    const users = await prisma.user.findMany();

    for (const user of users) {
        await prisma.socket_session.create({
            data: {
                ip: 'user',
                user: { connect: { id: user.id } },
                subscriber: { connect: { id: user.subscriber_id } },
            },
        });
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
