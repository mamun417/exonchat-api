import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Subscriber } from '../../subscribers/entities/subscriber.entity';
import { ChatAgent } from '../../chat-agents/entities/chat-agent.entity';
import { ConversationClient } from '../../conversation-clients/entities/conversation-client.entity';

export enum ChatClientTypes {
    CLIENT = 'client',
    AGENT = 'agent',
    ADMIN = 'admin',
}

@Entity()
export class ChatClient {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        nullable: true,
        type: 'varchar',
    })
    info: string;

    @Column({
        type: 'varchar',
    })
    host_log: string;

    @Column({
        nullable: true,
        type: 'varchar',
    })
    init_name: string;

    @Column({
        type: 'enum',
        enum: ChatClientTypes,
        default: ChatClientTypes.CLIENT,
    })
    type: string;

    @Column({
        nullable: true,
        type: 'varchar',
    })
    identifier: string;

    @Column({
        nullable: true,
        type: 'varchar',
    })
    init_email: string;

    @Column({
        type: 'uuid',
        nullable: true,
    })
    agent_id: string;

    @Column({
        type: 'uuid',
    })
    subscriber_id: string;

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

    @ManyToOne((type) => Subscriber, (subscriber) => subscriber.chat_clients)
    @JoinColumn({ name: 'subscriber_id' })
    subscriber: Subscriber;

    @ManyToOne((type) => ChatAgent, (chat_agent) => chat_agent.chat_agents)
    @JoinColumn({ name: 'agent_id' })
    chat_agent: ChatAgent;

    @OneToMany(
        (type) => ConversationClient,
        (conversation_client) => conversation_client.chat_client,
    )
    conversation_clients: ConversationClient[];
}
