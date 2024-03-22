import { Entity, Column, BaseEntity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { ModeDivision } from "./MCA_AYIM/modeDivision";
import { User } from "./user";

@Entity()
export class UserStatistics extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @ManyToOne(() => ModeDivision, modeDivision => modeDivision.userStatistics, {
        nullable: false,
    })
        modeDivision!: ModeDivision;

    @ManyToOne(() => User, user => user.userStatistics, {
        nullable: false,
    })
        user!: User;

    @Column("double", { default: 0 })
        BWS!: number;

    @Column("double", { default: 0 })
        rank!: number;

    @Column("double", { default: 0 })
        pp!: number;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
        lastVerified!: Date;

}