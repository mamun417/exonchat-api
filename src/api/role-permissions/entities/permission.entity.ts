import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from './role.entity';

@Entity()
export class Permission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    slug: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @ManyToMany((type) => Role, (role) => role.permissions, {
        cascade: true,
    })
    @JoinTable()
    roles: Role[];

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
