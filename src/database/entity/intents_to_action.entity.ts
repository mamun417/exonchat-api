import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class IntentsToAction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    intent_id: number;

    @Column()
    resolved: string;

    @Column()
    type: string;

    @Column({
        nullable: true,
    })
    subscriber_id: number;

    @Column({
        nullable: true,
        type: 'longtext',
    })
    content: string;

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
