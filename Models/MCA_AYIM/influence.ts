import { Entity, BaseEntity, ManyToOne, PrimaryGeneratedColumn, Column } from "typeorm";
import { User } from "../user";

@Entity()
export class Influence extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @ManyToOne(() => User, user => user.influences, { nullable: false })
    user!: User;

    @ManyToOne(() => User, user => user.influencing, { nullable: false })
    influence!: User;

    @Column({ type: "year" })
    year!: number;
}
