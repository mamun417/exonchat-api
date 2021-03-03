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
import { ConversationClient } from '../../conversation-clients/entities/conversation-client.entity';

@Entity()
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        nullable: true,
        type: 'uuid',
    })
    agents_only: string;

    @Column({
        type: 'uuid',
    })
    subscriber_id: string;

    @Column({
        default: 'web_chat',
    })
    type: string;

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    closed_at: string;

    @Column({
        type: 'uuid',
    })
    close_by_id: string;

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

    @OneToMany((type) => Message, (message) => message.conversation)
    messages: Message[];

    @ManyToOne((type) => Subscriber, (subscriber) => subscriber.conversations)
    @JoinColumn({ name: 'subscriber_id' })
    subscriber: Subscriber;

    @OneToMany(
        (type) => ConversationClient,
        (conversation_client) => conversation_client.conversation,
    )
    conversation_clients: ConversationClient[];
}
