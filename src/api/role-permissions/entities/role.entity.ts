import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn, RelationId } from 'typeorm';
import { Permission } from './permission.entity';

@Entity()
export class Role {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    slug: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @ManyToMany((type) => Permission, (permission) => permission.roles, { cascade: true })
    @JoinTable()
    permissions: Permission[];

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
