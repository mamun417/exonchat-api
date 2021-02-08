import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    PrimaryColumn,
    Generated,
    BeforeInsert,
    InsertEvent,
} from 'typeorm';

import { v4 as uuid } from 'uuid';

@Entity()
export class Messages {
    @PrimaryColumn({ type: 'binary', length: 100 })
    id: number;

    @Column()
    conversation_id: number;

    @Column({
        type: 'longtext',
    })
    msg: string;
    //

    @Column()
    sender: string;

    @Column()
    sender_type: string;

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

    @BeforeInsert()
    beforeInsert() {
        this.id = uuid('binary');
    }
}
