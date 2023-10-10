import { Entity, Column, BaseEntity, ManyToOne, PrimaryGeneratedColumn, SelectQueryBuilder, Index } from "typeorm";
import { ModeDivisionType } from "../../Interfaces/modes";
import { User } from "../user";

@Entity()
@Index(["year", "standard", "taiko", "fruits", "mania", "storyboard"])
export class MCAEligibility extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @Index()
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

    static whereMode (modeId: number, qb?: SelectQueryBuilder<MCAEligibility>): SelectQueryBuilder<MCAEligibility> {
        const eligibilityQuery = qb ?? this.createQueryBuilder("eligibility");
        
        switch (modeId) {
            case ModeDivisionType.standard:
                eligibilityQuery.where("eligibility.standard = 1");
                break;
            case ModeDivisionType.taiko:
                eligibilityQuery.where("eligibility.taiko = 1");
                break;
            case ModeDivisionType.mania:
                eligibilityQuery.where("eligibility.mania = 1");
                break;
            case ModeDivisionType.fruits:
                eligibilityQuery.where("eligibility.fruits = 1");
                break;
            case ModeDivisionType.storyboard:
                eligibilityQuery.where("eligibility.storyboard = 1");
                break;
        }

        return eligibilityQuery;
    }

}
