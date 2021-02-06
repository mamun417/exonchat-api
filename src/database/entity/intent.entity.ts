import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Intents {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        nullable: true,
    })
    parent_id: number;

    @Column()
    tag: string;

    @Column({
        nullable: true,
    })
    subscriber_id: number;

    @Column({
        nullable: true,
    })
    ai_id: number;

    @Column({
        type: 'float',
        nullable: true,
    })
    confidence: number;

    @Column({
        type: 'longtext',
        nullable: true,
    })
    description: string;

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
