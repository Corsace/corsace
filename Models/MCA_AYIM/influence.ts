import { Entity, BaseEntity, ManyToOne, PrimaryGeneratedColumn, Column } from "typeorm";
import { User } from "../user";
import { ModeDivision } from "./modeDivision";

@Entity()
export class Influence extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @ManyToOne(() => User, user => user.influences, { nullable: false })
    user!: User;

    @ManyToOne(() => User, user => user.influencing, { nullable: false })
    influence!: User;

    @Column({ type: "year", nullable: false })
    year!: number;

    @ManyToOne(() => ModeDivision, modeDivision => modeDivision.influences, {
        nullable: false,
        eager: true,
    })
    mode!: ModeDivision;

    @Column()
    rank!: number;

    @Column({ type: "text", nullable: true })
    comment!: string;

    @Column({ default: false })
    isValid!: boolean;

    @ManyToOne(() => User, user => user.influenceReviews)
    reviewer?: User;

    @Column({ nullable: true })
    lastReviewedAt?: Date;
}
