import { Entity, BaseEntity, PrimaryColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { GuestRequest } from "./MCA_AYIM/guestRequest";
import { ModeDivision } from "./MCA_AYIM/modeDivision";
import { Beatmapset } from "./beatmapset";

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

    @Column("double")
    totalSR!: number;

    @OneToMany(() => GuestRequest, guestRequest => guestRequest.beatmap)
    guestRequests!: GuestRequest[];

}
