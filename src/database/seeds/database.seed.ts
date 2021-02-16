import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import { Subscriber } from '../../api/subscribers/entities/subscriber.entity';
import { ChatAgent } from '../../api/chat-agents/entities/chat-agent.entity';

import * as _ from 'lodash';
import { ChatClient } from '../../api/chat-clients/entities/chat-client.entity';
import { Conversation } from '../../api/conversations/entities/conversation.entity';
import { Message } from '../../api/messages/entities/message.entity';

export default class CreateDatabase implements Seeder {
    public ids = {};

    public async run(factory: Factory, connection: Connection): Promise<any> {
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
                const gen = {};

                const lastRelatesPicked = _.last(model.relates);
                const picked = this.randomPick(this.ids[lastRelatesPicked]);

                if (_.isPlainObject(picked)) {
                    for (const mr of model.relates) {
                        if (
                            model.nullable &&
                            model.nullable.includes(mr) &&
                            Math.random() > 0.5
                        ) {
                            gen[mr] = null;
                        } else {
                            gen[mr] = picked[mr];
                        }
                    }
                } else {
                    if (
                        model.nullable &&
                        model.nullable.includes(lastRelatesPicked) &&
                        Math.random() > 0.5
                    ) {
                        gen[lastRelatesPicked] = null;
                    } else {
                        gen[lastRelatesPicked] = picked;
                    }
                }

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

    public randomPick(items) {
        return items[Math.floor(Math.random() * items.length)];
    }

    //
}
