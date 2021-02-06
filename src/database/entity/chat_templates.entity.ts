import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ChatTemplates {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    tag: string;

    @Column({
        nullable: true,
        type: 'longtext',
    })
    content: string;

    @Column({
        nullable: true,
    })
    intent_action_id: number;

    @Column({
        nullable: true,
    })
    subscriber_id: number;

    @Column({
        nullable: true,
    })
    agent_id: number;

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    createdAt: string;

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    updatedAt: string;
}
