import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import CreateConversations from './conversation';
import CreateMessages from './message';
import CreateSubscribers from './subscriber';
import CreateChatAgents from './chat-agent';
import { Subscriber } from '../../api/subscribers/entities/subscriber.entity';
import { ChatAgent } from '../../api/chat-agents/entities/chat-agent.entity';

import * as _ from 'lodash';
import { ChatClient } from '../../api/chat-clients/entities/chat-client.entity';

export default class CreateDatabase implements Seeder {
    public ids = {};

    public async run(factory: Factory, connection: Connection): Promise<any> {
        // const subscribers = await new CreateSubscribers().run(
        //     factory,
        //     connection,
        // );

        // await new CreateChatAgents().run(factory, connection);

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
                count: 20,
                nullable: ['agent_id'],
            },
        ]);
        // await new CreateMessages().run(factory, connection);
        // await new CreateConversations().run(factory, connection);
        // await new CreateChatClients().run(factory, connection);
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

                // for (const mr of model.relates) {
                //     if (
                //         model.nullable &&
                //         model.nullable.includes(mr) &&
                //         Math.random() > 0.5
                //     ) {
                //         pushObj[mr] = 0;
                //         continue;
                //     }
                //
                //     if (_.isPlainObject(picked)) {
                //         pushObj[mr] = picked[mr];
                //     } else {
                //         pushObj[mr] = picked;
                //     }
                // }

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
