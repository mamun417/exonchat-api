import { PrismaClient } from '@prisma/client';
import * as _l from 'lodash';
import * as bcrypt from 'bcrypt';
import cuid from 'cuid';

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
            use_for: 'owner',
            permissions: [{ slug: 'subscriber_list', name: 'Subscriber List', use_for: 'owner' }],
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
            slug: 'manager',
            name: 'Manager',
            use_for: 'subscriber',
            permissions: [{ slug: 'agent_assign', name: 'Agent Assign', use_for: 'subscriber' }],
        },
    ];

    const rolesData = [];

    for (const role of roles) {
        const roleData = await prisma.role.upsert({
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

        rolesData.push(roleData);
    }

    const subscriptions = await Promise.all([
        await prisma.subscription.upsert({
            where: {
                slug: 'free',
            },
            create: {
                slug: 'free',
                display_name: 'Free',
                one_day_price: 0,
                active: true,
            },
            update: {}
        }),
    ]);

    // saleh@exonhost.com

    // const adminUser = await prisma.user.findFirst({
    //     where: {
    //         email: 'saleh@exonhost.com',
    //     },
    // });
    //
    // if (!adminUser) {
    //     const subscriber = await prisma.subscriber.create({
    //         data: {
    //             active: true,
    //             subscriber_meta: {
    //                 create: {
    //                     company_name: 'exonhost',
    //                     display_name: 'ExonHost',
    //                 },
    //             },
    //             subscriber_secret: {
    //                 create: { api_key: "exonhost" },
    //             },
    //             users: {
    //                 create: [
    //                     {
    //                         email: 'saleh@exonhost.com',
    //                         active: true,
    //                         role: {
    //                             connect: {
    //                                 id: _l.find(rolesData, { slug: 'admin' }).id,
    //                             },
    //                         },
    //                         user_meta: {
    //                             create: {
    //                                 display_name: 'Saleh Ahmed',
    //                                 full_name: 'Saleh Ahmed',
    //                             },
    //                         },
    //                         user_secret: {
    //                             create: {
    //                                 password: await bcrypt.hash('0000', await bcrypt.genSalt()),
    //                             },
    //                         },
    //                     },
    //                 ],
    //             },
    //             subscriber_subscription: {
    //                 create: {
    //                     subscription: { connect: { id: subscriptions[0].id } },
    //                 },
    //             },
    //             subscriber_ai: {
    //                 create: {
    //                     access_token: 'M4N62UXFS75RPPA27NMR2ZZVXLF7LJDF',
    //                     app_name: 'exonchat',
    //                     app_id: '3931523956965521',
    //                 },
    //             },
    //         },
    //         include: {
    //             subscriber_meta: true,
    //             users: true,
    //         },
    //     });
    //
    //     await Promise.all(
    //         ['other', 'support', 'technical'].map(async (tp, key) => {
    //             const userConnector =
    //                 tp === 'technical'
    //                     ? {
    //                           users: {
    //                               connect: {
    //                                   id: subscriber.users[0].id,
    //                               },
    //                           },
    //                       }
    //                     : {};
    //
    //             await prisma.chat_department.create({
    //                 data: {
    //                     tag: tp,
    //                     description: tp,
    //                     subscriber: { connect: { id: subscriber.id } },
    //                     ...userConnector,
    //                 },
    //             });
    //         }),
    //     );
    //
    //     await prisma.socket_session.create({
    //         data: {
    //             init_ip: 'ip',
    //             init_user_agent: 'browser',
    //             use_for: 'user',
    //             user: { connect: { id: subscriber.users[0].id } },
    //             subscriber: { connect: { id: subscriber.id } },
    //         },
    //     });
    // }

    const subscriberData = await Promise.all(
        ['test', 'other'].map(async (namePart, key) => {
            const subscriber = await prisma.subscriber.create({
                data: {
                    active: true,
                    subscriber_meta: {
                        create: {
                            company_name: namePart,
                            display_name: namePart,
                        },
                    },
                    subscriber_secret: {
                        create: { api_key: namePart },
                    },
                    users: {
                        create: [
                            {
                                email: `${namePart}@${namePart}.${namePart}`,
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
                                user_secret: {
                                    create: {
                                        password: await bcrypt.hash('123', await bcrypt.genSalt()),
                                    },
                                },
                            },
                            {
                                email: `${namePart}1@${namePart}.${namePart}`,
                                active: true,
                                role: {
                                    connect: {
                                        id: _l.find(rolesData, { slug: 'agent' }).id,
                                    },
                                },
                                user_meta: {
                                    create: {
                                        display_name: `${namePart}1`,
                                        full_name: `${namePart}1`,
                                    },
                                },
                                user_secret: {
                                    create: {
                                        password: await bcrypt.hash('123', await bcrypt.genSalt()),
                                    },
                                },
                            },
                            {
                                email: `${namePart}2@${namePart}.${namePart}`,
                                active: true,
                                role: {
                                    connect: {
                                        id: _l.find(rolesData, { slug: 'manager' }).id,
                                    },
                                },
                                user_meta: {
                                    create: {
                                        display_name: `${namePart}2`,
                                        full_name: `${namePart}2`,
                                    },
                                },
                                user_secret: {
                                    create: {
                                        password: await bcrypt.hash('123', await bcrypt.genSalt()),
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
                    subscriber_ai: {
                        create: {
                            access_token: 'M4N62UXFS75RPPA27NMR2ZZVXLF7LJDF',
                            app_name: 'exonchat',
                            app_id: '3931523956965521',
                        },
                    },
                },
                include: {
                    subscriber_meta: true,
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
                                              subscriber.subscriber_meta.company_name === 'test'
                                                  ? 'test1@test.test'
                                                  : 'other1@other.other',
                                          ]).id,
                                      },
                                  },
                              }
                            : {
                                  users: {
                                      connect: [
                                          {
                                              id: _l.find(subscriber.users, [
                                                  'email',
                                                  subscriber.subscriber_meta.company_name === 'test'
                                                      ? 'test@test.test'
                                                      : 'other@other.other',
                                              ]).id,
                                          },
                                          {
                                              id: _l.find(subscriber.users, [
                                                  'email',
                                                  subscriber.subscriber_meta.company_name === 'test'
                                                      ? 'test2@test.test'
                                                      : 'other2@other.other',
                                              ]).id,
                                          },
                                      ],
                                  },
                              };

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
            default_value: 'blue-grey',
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
            slug: 'apps_whmcs_api_url',
            display_name: 'API URL',
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
            display_name: 'Ai auto reply at client message',
            category: 'ai',
            sub_category: 'reply',
            default_value: 'false',
            user_type: 'subscriber',
            input_type: 'checkbox',
        },
        {
            slug: 'ai_not_resolve_reply_message',
            display_name: 'Ai reply message when ai can not resolve',
            category: 'ai',
            sub_category: 'reply',
            default_value: 'Sorry can not understand. Transferring chat to a available agent',
            user_type: 'subscriber',
            input_type: 'textarea',
        },

        {
            slug: 'conversation_at_initiate_notify_policy',
            display_name: 'New chat notify policy',
            category: 'conversation',
            sub_category: 'notification_policy',
            default_value: 'manual',
            value_options: {
                options: [
                    { slug: 'manual', name: 'Manual' },
                    { slug: 'round_robin', name: 'Round Robin' },
                ],
            },
            user_type: 'subscriber',
            input_type: 'select',
        },
        {
            slug: 'conversation_at_initiate_join_policy',
            display_name: 'New chat notify policy',
            category: 'conversation',
            sub_category: 'join_policy',
            default_value: 'false',
            user_type: 'subscriber',
            input_type: 'checkbox',
        },
        {
            slug: 'conversation_notify_at_round_robin_max',
            display_name: 'Each agents chat limit for notify',
            category: 'conversation',
            sub_category: 'notification',
            default_value: '3',
            user_type: 'subscriber',
            input_type: 'integer',
        },
    ];

    for (const setting of settingsData) {
        const category: any = setting.category;
        const user_type: any = setting.user_type;
        const input_type: any = setting.input_type || 'text';

        const createObj: any = {
            slug: setting.slug,
            display_name: setting.display_name,
            category: category,
            sub_category: setting.sub_category,
            default_value: setting.default_value,
            user_type: user_type,
            input_type: input_type,
        };

        if (setting.value_options) {
            createObj.value_options = setting.value_options;
        }

        await prisma.setting.upsert({
            where: {
                slug_identifier: {
                    slug: setting.slug,
                    category: category,
                    user_type: user_type,
                },
            },
            create: createObj,
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
