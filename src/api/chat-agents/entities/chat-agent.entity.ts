import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Message } from '../../messages/entities/message.entity';
import { Subscriber } from '../../subscribers/entities/subscriber.entity';
import { ChatClient } from '../../chat-clients/entities/chat-client.entity';

@Entity()
export class ChatAgent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'uuid',
    })
    subscriber_id: string;

    @Column()
    email: string;

    @Column()
    password: string;

    @Column()
    active: boolean;

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

    @ManyToOne((type) => Subscriber, (subscriber) => subscriber.chat_agents)
    @JoinColumn({ name: 'subscriber_id' })
    subscriber: Subscriber;

    @OneToMany((type) => ChatClient, (chat_client) => chat_client.chat_agent)
    chat_agents: ChatAgent[];
}
