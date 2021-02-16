import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Conversation } from '../../conversations/entities/conversation.entity';
import { Subscriber } from '../../subscribers/entities/subscriber.entity';

@Entity()
export class Message {
    // @PrimaryColumn({ type: 'binary', length: 100 })
    // id: number;

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'uuid',
    })
    conversation_id: string;

    @Column({
        type: 'longtext',
    })
    msg: string;

    @Column()
    sender: string;

    @Column()
    sender_type: string;

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

    // @BeforeInsert()
    // beforeInsert() {
    //     this.id = uuid('binary');
    // }

    @ManyToOne((type) => Conversation, (conversation) => conversation.messages)
    @JoinColumn({ name: 'conversation_id' })
    conversation: Conversation;

    @ManyToOne((type) => Subscriber, (subscriber) => subscriber.messages)
    @JoinColumn({ name: 'subscriber_id' })
    subscriber: Subscriber;
}
