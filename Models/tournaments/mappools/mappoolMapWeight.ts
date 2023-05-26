import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../user";
import { MappoolMap } from "./mappoolMap";
import { MappoolMapSkillType } from "./mappoolMapSkill";

@Entity()
export class MappoolMapWeight extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @Column()
        weight!: number;

    @Column({ type: "enum", enum: MappoolMapSkillType, nullable: false })
        skill!: MappoolMapSkillType;

    @ManyToOne(() => User, user => user.mappoolMapSkillWeights)
        user!: User;

    @ManyToOne(() => MappoolMap, mappoolMap => mappoolMap.skillWeights)
        mappoolMap!: MappoolMap;

}