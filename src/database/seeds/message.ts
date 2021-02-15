import { factory, Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import { Message } from '../../api/messages/entities/message.entity';
import { Conversation } from '../../api/conversations/entities/conversation.entity';

export default class CreateMessages implements Seeder {
    public async run(factory: Factory, connection: Connection): Promise<any> {
        console.log('\n ---------------Creating message----------------');

        // await factory(Message)().createMany(200);
        // const messageIds = messages.map((message: Message) => message.id);
        // const conversation: Conversation[] = await factory(
        //     Conversation,
        // )().createMany(2);
        //
        // await factory(Message)()
        //     .map(async (message: Message) => {
        //         message.conversation_id =
        //             conversation[
        //                 Math.floor(Math.random() * conversation.length)
        //             ].id;
        //
        //         return message;
        //     })
        //     .createMany(5);
    }
}
