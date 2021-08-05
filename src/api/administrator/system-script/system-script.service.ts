import { HttpException, HttpService, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class SystemScriptService {
    constructor(private prisma: PrismaService, private httpService: HttpService) {}

    async test(req: any) {
        return 'test';
    }

    //when a intent is marked for delete or update, delete will be happened last
    // cz delete is action for take. that's y its safe that after delete no submit will happen
    async intentEntryForSubmit(req: any) {
        const intentForUpdate = await this.prisma.intent.findFirst({
            where: {
                script_name: null,
                script_status: null,
                submit_to_ai: true,
                remove_from_ai: false,
                for_delete: false,
                ai_id: null,
            },
        });

        if (intentForUpdate) {
            // currently prisma does not support update many with limiting so
            // i have to first query then update by id also with the query
            await this.prisma.intent.updateMany({
                where: {
                    id: intentForUpdate.id,
                    script_name: null,
                    script_status: null,
                    submit_to_ai: true,
                    remove_from_ai: false,
                    for_delete: false,
                    ai_id: null,
                },
                data: {
                    script_name: 'purple',
                    script_status: 'pending',
                },
            });

            // update many does not contain row data. only updated count
            return intentForUpdate;
        }

        return null;
    }

    async intentEntryForRemoveFromAI(req: any) {
        const intentForAIRemove = await this.prisma.intent.findFirst({
            where: {
                script_name: null,
                script_status: null,
                submit_to_ai: false,
                remove_from_ai: true,
                for_delete: false,
            },
        });

        if (intentForAIRemove) {
            if (!intentForAIRemove.ai_id) {
                // if no ai_id just update the entry
                await this.prisma.intent.updateMany({
                    where: {
                        id: intentForAIRemove.id,
                        script_name: null,
                        script_status: null,
                        submit_to_ai: false,
                        remove_from_ai: true,
                        for_delete: false,
                        ai_id: null,
                    },
                    data: {
                        remove_from_ai: false,
                    },
                });

                return null;
            }

            await this.prisma.intent.updateMany({
                where: {
                    id: intentForAIRemove.id,
                    script_name: null,
                    script_status: null,
                    submit_to_ai: false,
                    remove_from_ai: true,
                    for_delete: false,
                    ai_id: { not: null }, // its important here
                },
                data: {
                    script_name: 'purple',
                    script_status: 'pending',
                },
            });

            // update many does not contain row data. only updated count
            return intentForAIRemove;
        }

        return null;
    }

    async intentEntryForDelete(req: any) {
        const intentForDelete = await this.prisma.intent.findFirst({
            where: {
                script_name: null,
                script_status: null,
                for_delete: true,
            },
        });

        if (intentForDelete) {
            // if no ai_id found then delete from db
            if (!intentForDelete.ai_id) {
                await this.prisma.intent_action.deleteMany({
                    where: {
                        intent_id: intentForDelete.id,
                    },
                });

                await this.prisma.intent.delete({
                    where: { id: intentForDelete.id },
                });

                return null;
            }

            await this.prisma.intent.updateMany({
                where: {
                    id: intentForDelete.id,
                    script_name: null,
                    script_status: null,
                    for_delete: true,
                    ai_id: { not: null }, // ai_id not null check important here
                },
                data: {
                    script_name: 'purple',
                    script_status: 'pending',
                },
            });

            return intentForDelete;
        }

        return null;
    }
}
