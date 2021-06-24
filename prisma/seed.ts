import { PrismaClient } from '@prisma/client';
import * as _l from 'lodash';

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
            return await prisma.role.upsert({
                where: {
                    role_identifier: {
                        slug: role.slug,
                        use_for: role.use_for,
                    },
                },
                create: {
                    slug: role.slug,
                    name: role.name,
                    use_for: role.use_for,
                    permissions: {
                        connectOrCreate: role.permissions.map((permission: any) => {
                            return {
                                where: {
                                    permission_identifier: { slug: permission.slug, use_for: permission.use_for },
                                },
                                create: { slug: permission.slug, use_for: permission.use_for, name: permission.name },
                            };
                        }),
                    },
                },
                update: {
                    name: role.name,
                    use_for: role.use_for,
                    permissions: {
                        connectOrCreate: role.permissions.map((permission: any) => {
                            return {
                                where: {
                                    permission_identifier: { slug: permission.slug, use_for: permission.use_for },
                                },
                                create: { slug: permission.slug, use_for: permission.use_for, name: permission.name },
                            };
                        }),
                    },
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
                    ai: {
                        create: {
                            access_token: 'M4N62UXFS75RPPA27NMR2ZZVXLF7LJDF',
                            app_name: 'exonchat',
                            app_id: '3931523956965521',
                        },
                    },
                },
                include: {
                    users: true,
                },
            });

            await Promise.all(
                ['other', 'support', 'technical'].map(async (tp, key) => {
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
                init_ip: 'ip',
                init_user_agent: 'browser',
                use_for: 'user',
                user: { connect: { id: user.id } },
                subscriber: { connect: { id: user.subscriber_id } },
            },
        });
    }

    const settingsData = [
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
            default_value: '',
            user_type: 'subscriber',
        },
        {
            slug: 'apps_whmcs_secret_key',
            display_name: 'Secret Key',
            category: 'app',
            sub_category: 'whmcs',
            default_value: '',
            user_type: 'subscriber',
        },
        {
            slug: 'apps_whmcs_enable',
            display_name: 'Connection Enable/Disable',
            category: 'app',
            sub_category: 'whmcs',
            default_value: 'false',
            user_type: 'subscriber',
            input_type: 'checkbox',
        },
        {
            slug: 'apps_whmcs_ticket_notification',
            display_name: 'Ticket notification',
            category: 'app',
            sub_category: 'whmcs',
            default_value: 'false',
            user_type: 'subscriber',
            input_type: 'checkbox',
        },
        {
            slug: 'apps_whmcs_ticket_manage',
            display_name: 'Ticket manager',
            category: 'app',
            sub_category: 'whmcs',
            default_value: 'false',
            user_type: 'subscriber',
            input_type: 'checkbox',
        },
        {
            slug: 'apps_whmcs_ticket_submit_from_chat',
            display_name: 'Ticket submit from chat',
            category: 'app',
            sub_category: 'whmcs',
            default_value: 'false',
            user_type: 'subscriber',
            input_type: 'checkbox',
        },

        {
            slug: 'ai_auto_reply_at_client_msg',
            display_name: 'Ticket submit from chat',
            category: 'ai',
            sub_category: 'reply',
            default_value: 'false',
            user_type: 'subscriber',
            input_type: 'checkbox',
        },
    ];

    for (const setting of settingsData) {
        const category: any = setting.category;
        const user_type: any = setting.user_type;
        const input_type: any = setting.input_type || 'text';

        await prisma.setting.upsert({
            where: {
                slug_identifier: {
                    slug: setting.slug,
                    category: category,
                    user_type: user_type,
                },
            },
            create: {
                slug: setting.slug,
                display_name: setting.display_name,
                category: category,
                sub_category: setting.sub_category,
                default_value: setting.default_value,
                user_type: user_type,
                input_type: input_type,
            },
            update: {},
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
