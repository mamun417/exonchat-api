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
                include: {
                    users: true,
                },
            });

            await Promise.all(
                ['any', 'support', 'technical'].map(async (tp, key) => {
                    const userConnector =
                        tp === 'support'
                            ? {
                                  users: {
                                      connect: {
                                          id: _l.find(subscriber.users, [
                                              'email',
                                              subscriber.company_name === 'test'
                                                  ? 'test1@test.test'
                                                  : 'other1@other.other',
                                          ]).id,
                                      },
                                  },
                              }
                            : {};

                    await prisma.chat_department.create({
                        data: {
                            tag: tp,
                            description: tp,
                            subscriber: { connect: { id: subscriber.id } },
                            ...userConnector,
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

    await prisma.setting.createMany({
        data: [
            {
                slug: 'global_color',
                display_name: 'Global Color',
                category: 'ui',
                default_value: 'green',
                user_type: 'user',
            },

            {
                slug: 'apps_whmcs_identifier_key',
                display_name: 'Identifier Key',
                category: 'app',
                sub_category: 'whmcs',
                default_value: 'green',
                user_type: 'subscriber',
            },
            {
                slug: 'apps_whmcs_secret_key',
                display_name: 'Secret Key',
                category: 'app',
                sub_category: 'whmcs',
                default_value: 'green',
                user_type: 'subscriber',
            },
            {
                slug: 'apps_whmcs_enable',
                display_name: 'Connection Enable/Disable',
                category: 'app',
                sub_category: 'whmcs',
                default_value: 'green',
                user_type: 'subscriber',
            },
            {
                slug: 'apps_whmcs_ticket_notification',
                display_name: 'Ticket notification',
                category: 'app',
                sub_category: 'whmcs',
                default_value: 'green',
                user_type: 'subscriber',
            },
            {
                slug: 'apps_whmcs_ticket_manage',
                display_name: 'Ticket manager',
                category: 'app',
                sub_category: 'whmcs',
                default_value: 'green',
                user_type: 'subscriber',
            },
            {
                slug: 'apps_whmcs_ticket_submit_from_chat',
                display_name: 'Ticket submit from chat',
                category: 'app',
                sub_category: 'whmcs',
                default_value: 'green',
                user_type: 'subscriber',
            },
        ],
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
