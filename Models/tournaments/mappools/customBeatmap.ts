import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne } from "typeorm";
import { ModeDivision } from "../../MCA_AYIM/modeDivision";
import { MappoolMap } from "./mappoolMap";

@Entity()
export class CustomBeatmap extends BaseEntity {
    
    @PrimaryGeneratedColumn()
        ID!: number;

    @Column({ nullable: true })
        link?: string;

    @Column({ nullable: true })
        background?: string;

    @Column()
        artist!: string;

    @Column()
        title!: string;

    @Column("double")
        BPM!: number;

    @Column()
        totalLength!: number;

    @Column()
        hitLength!: number;

    @Column()
        difficulty!: string;

    @Column("double")
        circleSize!: number;

    @Column("double")
        overallDifficulty!: number;

    @Column("double")
        approachRate!: number;

    @Column("double")
        hpDrain!: number;

    @Column()
        circles!: number;

    @Column()
        sliders!: number;

    @Column()
        spinners!: number;

    @Column({ nullable: true })
        maxCombo?: number;

    @Column("double", { nullable: true })
        aimSR?: number;

    @Column("double", { nullable: true })
        speedSR?: number;

    @Column("double")
        totalSR!: number;

    @ManyToOne(() => ModeDivision, modeDivision => modeDivision.customBeatmaps, {
        nullable: false,
        eager: true,
    })
        mode!: ModeDivision;

    @OneToOne(() => MappoolMap, mappoolMap => mappoolMap.customBeatmap)
        mappoolMap?: MappoolMap;

}