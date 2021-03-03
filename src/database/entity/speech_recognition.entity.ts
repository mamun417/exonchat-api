import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SpeechRecognition {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('longtext')
    speech: string;

    @Column({
        nullable: true,
    })
    intent_id: number;

    @Column({
        nullable: true,
    })
    resolved: string;

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
