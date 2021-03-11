import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import { Subscriber } from '../../api/subscribers/entities/subscriber.entity';
import { ChatAgent } from '../../api/chat-agents/entities/chat-agent.entity';

import * as _ from 'lodash';
import { ChatClient } from '../../api/chat-clients/entities/chat-client.entity';
import { Conversation } from '../../api/conversations/entities/conversation.entity';
import { Message } from '../../api/messages/entities/message.entity';
import { ConversationClient } from '../../api/conversation-clients/entities/conversation-client.entity';
import { Permission } from '../../api/role-permissions/entities/permission.entity';

export default class CreateDatabase implements Seeder {
    public ids = {};

    public async run(factory: Factory, connection: Connection): Promise<any> {
        // permission factory
        await factory(Permission)().createMany(10);

        await this.hasRelations(factory, [
            {
                model: Subscriber,
                relate_name: 'subscriber_id',
                count: 2,
            },
            {
                model: ChatAgent,
                relates: ['subscriber_id'],
                relate_name: 'agent_id',
                count: 10,
            },
            {
                model: ChatClient,
                relates: ['subscriber_id', 'agent_id'],
                relate_name: 'chat_client_id',
                count: 10,
                nullable: ['agent_id'],
            },
            {
                model: Conversation,
                relates: ['subscriber_id'],
                relate_name: 'conversation_id',
                count: 10,
            },
            {
                model: Message,
                relates: ['subscriber_id', 'conversation_id'],
                relate_name: 'message_id',
                count: 10,
            },
            {
                model: ConversationClient,
                relates: ['conversation_id', 'chat_client_id'],
                relate_name: 'conversation_client_id',
                count: 5,
            },
        ]);
    }

    //
    public async hasRelations(factory, relationalModels) {
        for (const model of relationalModels) {
            await this.seed(factory, model);
        }

        console.log(this.ids);
        // console.log(relationalModels);
    }

    public async seed(factory, model) {
        if (!this.ids.hasOwnProperty(model.relate_name)) {
            this.ids[model.relate_name] = [];
        }

        for (const i of new Array(model.count ? model.count : 1)) {
            if (model.hasOwnProperty('relates')) {
                const gen = this.generateMultiRelations(model);

                const entry = await factory(model.model)().create(gen);

                const pushObj = { [model.relate_name]: entry.id };

                _.assign(pushObj, gen);

                this.ids[model.relate_name].push(pushObj);
            } else {
                const entry = await factory(model.model)().create();
                this.ids[model.relate_name].push(entry.id);
            }
        }
    }

    public generateMultiRelations(model) {
        const gen = {};
        const lastRelatesPicked = _.last(model.relates);
        const picked = this.randomPick(this.ids[lastRelatesPicked]);

        const notFoundedRelates = [];

        if (_.isPlainObject(picked)) {
            for (const mr of model.relates) {
                if (model.nullable && model.nullable.includes(mr) && Math.random() > 0.5) {
                    gen[mr] = null;
                } else {
                    if (!picked.hasOwnProperty(mr)) {
                        notFoundedRelates.push(mr);
                    } else {
                        gen[mr] = picked[mr];
                    }
                }
            }
        } else {
            if (model.nullable && model.nullable.includes(lastRelatesPicked) && Math.random() > 0.5) {
                gen[lastRelatesPicked] = null;
            } else {
                gen[lastRelatesPicked] = picked;
            }
        }

        if (notFoundedRelates.length) {
            for (const notFoundedRelate of notFoundedRelates) {
                const selectNotFoundedColumnEntries = this.ids[notFoundedRelate];

                let findAnyMatchedFromBefore = null;
                for (const g of Object.keys(gen)) {
                    const ranC = _.find(this.ids[g], [g, gen[g]]);

                    for (const rc of Object.keys(ranC)) {
                        const ll = _.find(selectNotFoundedColumnEntries, [rc, ranC[rc]]);

                        if (ll) {
                            findAnyMatchedFromBefore = ll;
                            break;
                        }
                    }

                    if (findAnyMatchedFromBefore) {
                        break;
                    }
                }

                gen[notFoundedRelate] = findAnyMatchedFromBefore[notFoundedRelate];
            }
        } else {
            // handle else if needed
        }

        return gen;
    }

    public randomPick(items) {
        return items[Math.floor(Math.random() * items.length)];
    }

    //
}
