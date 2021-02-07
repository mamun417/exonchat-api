import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Messages {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    conversation_id: number;

    @Column({
        type: 'longtext',
    })
    msg: string;

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
}
