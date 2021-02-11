import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum ChatClientTypes {
    CLIENT = 'client',
    AGENT = 'agent',
    ADMIN = 'admin',
}

@Entity()
export class ChatClient {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        nullable: true,
        type: 'json',
    })
    info: string;

    @Column({
        type: 'json',
    })
    host_log: string;

    @Column({
        nullable: true,
        type: 'varchar',
    })
    init_name: string;

    @Column({
        type: 'enum',
        enum: ChatClientTypes,
        default: ChatClientTypes.CLIENT,
    })
    type: string;

    @Column({
        nullable: true,
        type: 'varchar',
    })
    identifier: string;

    @Column({
        nullable: true,
        type: 'varchar',
    })
    init_email: string;

    @Column({
        type: 'uuid',
    })
    agent_id: string;

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
}
