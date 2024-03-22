import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Beatmap } from "../../beatmap";
import { User } from "../../user";
import { MappoolMapHistory } from "./mappoolMapHistory";
import { MappoolMapSkill } from "./mappoolMapSkill";
import { MappoolMapWeight } from "./mappoolMapWeight";
import { MappoolSlot } from "./mappoolSlot";
import { CustomBeatmap } from "./customBeatmap";
import { JobPost } from "./jobPost";
import { MatchupMap } from "../matchupMap";
import { MappoolReplay } from "./mappoolReplay";

@Entity()
export class MappoolMap extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @CreateDateColumn()
        createdAt!: Date;
    
    @ManyToOne(() => User, user => user.mappoolMapsCreated, {
        nullable: false,
    })
        createdBy!: User;

    @ManyToOne(() => User, user => user.mappoolMapsAssigned)
        assignedBy?: User | null;
    
    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
        lastUpdate!: Date;

    @Column({ nullable: false })
        order!: number;

    @Column({ default: false })
        isCustom!: boolean;

    @Column({ type: "datetime", nullable: true })
        deadline?: Date | null;

    @ManyToOne(() => MappoolSlot, slot => slot.maps, {
        nullable: false,
    })
        slot!: MappoolSlot;

    @Column({ type: "varchar", nullable: true })
        customThreadID?: string | null;

    @Column({ type: "varchar", nullable: true })
        customMessageID?: string | null;

    @ManyToMany(() => User, user => user.customMapsTested)
    @JoinTable()
        testplayers!: User[];

    @ManyToMany(() => User, user => user.customMaps)
    @JoinTable()
        customMappers!: User[];

    @OneToOne(() => JobPost, post => post.map)
    @JoinColumn()
        jobPost?: JobPost | null;

    @OneToOne(() => CustomBeatmap, beatmap => beatmap.mappoolMap)
    @JoinColumn()
        customBeatmap?: CustomBeatmap | null;

    @OneToOne(() => MappoolReplay, replay => replay.mappoolMap)
    @JoinColumn()
        replay?: MappoolReplay | null;

    @ManyToOne(() => Beatmap, beatmap => beatmap.mappoolMaps)
        beatmap?: Beatmap | null;

    @OneToMany(() => MappoolMapHistory, history => history.mappoolMap)
        history!: MappoolMapHistory[];

    @OneToMany(() => MappoolMapSkill, skill => skill.mappoolMap)
        skillRatings!: MappoolMapSkill[];

    @OneToMany(() => MappoolMapWeight, weight => weight.mappoolMap)
        skillWeights!: MappoolMapWeight[];

    @OneToMany(() => MatchupMap, map => map.map)
        matchMaps!: MatchupMap[];
}