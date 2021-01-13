import { Entity, Column, BaseEntity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user";

@Entity()
export class MCAEligibility extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column({ type: "year" })
    year!: number;

    @Column({ default: false })
    standard!: boolean;

    @Column({ default: false })
    taiko!: boolean;

    @Column({ default: false })
    fruits!: boolean;

    @Column({ default: false })
    mania!: boolean;

    @Column({ default: false })
    storyboard!: boolean;

    @ManyToOne(() => User, user => user.mcaEligibility)
    user!: User;

}
