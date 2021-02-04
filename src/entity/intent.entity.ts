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
        nullable: true,
    })
    confidence: string;

    @Column({
        nullable: true,
    })
    description: string;

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
