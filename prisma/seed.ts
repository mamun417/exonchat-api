import { PrismaClient } from '@prisma/client';
import * as _f from 'faker';
import * as _l from 'lodash';
import { create } from 'node:domain';

const prisma = new PrismaClient();

async function main() {
    const permissions = [
        { slug: 'agent_create', name: 'Agent Create' },
        { slug: 'chat_join', name: 'Chat Join' },
    ];
    const roles = [
        { slug: 'admin', name: 'Admin' },
        { slug: 'agent', name: 'Agent' },
    ];

    const permissionData = await Promise.all(
        permissions.map(async (permission) => {
            return await prisma.permission.upsert({
                where: { slug: permission.slug },
                create: permission,
                update: permission,
            });
        }),
    );

    const rolesData = await Promise.all(
        roles.map(async (role) => {
            const idCond = { slug: role.slug === 'admin' ? 'agent_create' : 'chat_join' };

            return await prisma.role.create({
                data: {
                    slug: role.slug,
                    name: role.name,
                    permissions: {
                        connect: {
                            id: _l.find(permissionData, idCond).id,
                        },
                    },
                },
            });
        }),
    );

    const subscriberData = await Promise.all(
        ['test', 'other'].map(async (emailPart, key) => {
            await prisma.subscriber.create({
                data: {
                    chat_agents: {
                        create: [
                            {
                                email: `${emailPart}@${emailPart}.${emailPart}`,
                                password: '123',
                                role: {
                                    connect: {
                                        id: _l.find(rolesData, { slug: 'admin' }).id,
                                    },
                                },
                            },
                            {
                                email: `${emailPart}1@${emailPart}.${emailPart}`,
                                password: '123',
                                role: {
                                    connect: {
                                        id: _l.find(rolesData, { slug: 'agent' }).id,
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
