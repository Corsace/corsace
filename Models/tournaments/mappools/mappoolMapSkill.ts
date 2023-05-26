import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../user";
import { MappoolMap } from "./mappoolMap";

export enum MappoolMapSkillType {
    JumpAim,
    FlowAim,
    AimControl,
    Tech,
    Precision,
    FingerControl,
    DensityReading,
    PatternReading,
    Stamina,
}

@Entity()
export class MappoolMapSkill extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @Column()
        rating!: number;

    @Column({ type: "enum", enum: MappoolMapSkillType, nullable: false })
        skill!: MappoolMapSkillType;

    @ManyToOne(() => User, user => user.mappoolMapSkillRatings)
        user!: User;

    @ManyToOne(() => MappoolMap, mappoolMap => mappoolMap.skillRatings)
        mappoolMap!: MappoolMap;

}