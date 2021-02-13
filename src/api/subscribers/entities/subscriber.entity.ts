import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Subscriber {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    email: string;

    @Column()
    password: string;

    @Column()
    active: boolean;

    @Column()
    api_key: string;

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

    // @BeforeInsert()
    // async setPassword(password: string) {
    //     const salt = await bcrypt.genSalt();
    //     this.password = await bcrypt.hash(password || this.password, salt);
    // }
}
