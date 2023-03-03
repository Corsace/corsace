import { BaseEntity, Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Beatmap } from "../../beatmap";
import { User } from "../../user";
import { MappoolMapHistory } from "./mappoolMapHistory";
import { MappoolMapSkill } from "./mappoolMapSkill";
import { MappoolMapWeight } from "./mappoolMapWeight";
import { MappoolSlot } from "./mappoolSlot";

@Entity()
export class MappoolMap extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @CreateDateColumn()
    createdAt!: Date;
    
    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    lastUpdate!: Date;

    @Column({ nullable: false })
    order!: number;

    @Column({ default: false })
    isCustom!: boolean;

    @Column({ nullable: true })
    deadline?: Date;

    @Column({ nullable: true })
    link?: string;

    @ManyToOne(() => MappoolSlot, slot => slot.maps)
    slot!: MappoolSlot;

    @ManyToMany(() => User, user => user.customMaps)
    @JoinTable()
    customMappers!: User[];

    @ManyToOne(() => Beatmap, beatmap => beatmap.mappoolMaps)
    beatmap!: Beatmap;

    @OneToMany(() => MappoolMapHistory, history => history.mappoolMap)
    history!: MappoolMapHistory[];

    @OneToMany(() => MappoolMapSkill, skill => skill.mappoolMap)
    skillRatings!: MappoolMapSkill[];

    @OneToMany(() => MappoolMapWeight, weight => weight.mappoolMap)
    skillWeights!: MappoolMapWeight[];
}