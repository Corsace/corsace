import { Entity, BaseEntity, PrimaryColumn, Column, ManyToOne, OneToMany, Index } from "typeorm";
import { GuestRequest } from "./MCA_AYIM/guestRequest";
import { ModeDivision } from "./MCA_AYIM/modeDivision";
import { Beatmapset } from "./beatmapset";
import { MappoolBeatmap } from "./tournaments/mappoolBeatmap";
import { BeatmapInfo } from "../Interfaces/beatmap";

@Entity()
export class Beatmap extends BaseEntity {

    @PrimaryColumn()
    ID!: number;

    @Column()
    beatmapsetID!: number;

    @ManyToOne(() => Beatmapset, beatmapset => beatmapset.beatmaps, {
        nullable: false,
    })
    beatmapset!: Beatmapset;

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

    @ManyToOne(() => ModeDivision, modeDivision => modeDivision.beatmaps, {
        nullable: false,
        eager: true,
    })
    mode!: ModeDivision;

    @Column()
    circles!: number;

    @Column()
    sliders!: number;

    @Column()
    spinners!: number;

    @Column("double")
    rating!: number;

    @Column({ default: false })
    storyboard!: boolean;

    @Column({ default: false })
    video!: boolean;

    @Column()
    playCount!: number;

    @Column()
    passCount!: number;

    @Column({ nullable: true })
    packs?: string;

    @Column({ nullable: true })
    maxCombo?: number;

    @Column("double", { nullable: true })
    aimSR?: number;

    @Column("double", { nullable: true })
    speedSR?: number;

    @Index()
    @Column("double")
    totalSR!: number;

    @OneToMany(() => GuestRequest, guestRequest => guestRequest.beatmap)
    guestRequests!: GuestRequest[];

    @OneToMany(() => MappoolBeatmap, mappoolBeatmap => mappoolBeatmap.beatmap)
    mappoolBeatmaps!: MappoolBeatmap[];

    public getInfo = async function(this: Beatmap): Promise<BeatmapInfo> {
        const info: BeatmapInfo = {
            ID: this.ID,
            beatmapsetID: this.beatmapsetID,
            beatmapset: await this.beatmapset.getInfo(),
            totalLength: this.totalLength,
            hitLength: this.hitLength,
            difficulty: this.difficulty,
            circleSize: this.circleSize,
            overallDifficulty: this.overallDifficulty,
            approachRate: this.approachRate,
            hpDrain: this.hpDrain,
            circles: this.circles,
            sliders: this.sliders,
            spinners: this.spinners,
            rating: this.rating,
            storyboard: this.storyboard,
            video: this.video,
            playCount: this.playCount,
            passCount: this.passCount,
            packs: this.packs,
            maxCombo: this.maxCombo,
            aimSR: this.aimSR,
            speedSR: this.speedSR,
            totalSR: this.totalSR,
        };
        return info;
    }

}
