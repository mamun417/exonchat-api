import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Message } from '../../messages/entities/message.entity';
import { Subscriber } from '../../subscribers/entities/subscriber.entity';
import { ChatClient } from '../../chat-clients/entities/chat-client.entity';

@Entity()
export class UserExtraPermission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'uuid',
    })
    permission_id: string;

    @Column({
        type: 'uuid',
    })
    user_id: string;

    @Column({ nullable: true })
    user_type: string;

    @Column({ default: 0 })
    include: boolean;

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
}
