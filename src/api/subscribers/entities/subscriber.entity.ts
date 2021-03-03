import {
    BeforeInsert,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Conversation } from '../../conversations/entities/conversation.entity';
import { ChatAgent } from '../../chat-agents/entities/chat-agent.entity';
import { ChatClient } from '../../chat-clients/entities/chat-client.entity';
import { Message } from '../../messages/entities/message.entity';

@Entity()
export class Subscriber {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    email: string;

    @Column()
    password: string;

    @Column()
    active: boolean;

    @Column()
    api_key: string;

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    created_at: string;

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    updated_at: string;

    @OneToMany((type) => ChatAgent, (chat_agent) => chat_agent.subscriber)
    chat_agents: ChatAgent[];

    @OneToMany((type) => ChatClient, (chat_client) => chat_client.subscriber)
    chat_clients: ChatClient[];

    @OneToMany(
        (type) => Conversation,
        (conversation) => conversation.subscriber,
    )
    conversations: Conversation[];

    @OneToMany((type) => Message, (message) => message.subscriber)
    messages: Message[];

    // @BeforeInsert()
    // async setPassword(password: string) {
    //     const salt = await bcrypt.genSalt();
    //     this.password = await bcrypt.hash(password || this.password, salt);
    // }
}
