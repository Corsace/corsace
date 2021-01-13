import { Entity, BaseEntity, PrimaryColumn, OneToMany, Column, ManyToOne } from "typeorm";
import { BeatmapsetInfo } from "../interfaces/beatmap";
import { Beatmap } from "./beatmap";
import { Nomination } from "./MCA_AYIM/nomination";
import { Vote } from "./MCA_AYIM/vote";
import { User } from "./user";

@Entity()
export class Beatmapset extends BaseEntity {
    
    @PrimaryColumn()
    ID!: number;
    
    @Column()
    artist!: string;

    @Column()
    title!: string;

    @Column()
    submitDate!: Date;

    @Column()
    approvedDate!: Date;

    @Column("double")
    BPM!: number;
    
    @Column()
    genre!: string;

    @Column()
    language!: string;
    
    @Column()
    favourites!: number;

    @Column({
        type: "longtext",
        charset: "utf8mb4",
        collation: "utf8mb4_unicode_520_ci",
    })
    tags!: string;
    
    @OneToMany(() => Beatmap, beatmap => beatmap.beatmapset, {
        eager: true,
    })
    beatmaps!: Beatmap[];

    @ManyToOne(() => User, user => user.beatmapsets, {
        eager: true,
    })
    creator!: User;
    
    @OneToMany(() => Nomination, nomination => nomination.beatmapset)
    nominationsReceived!: Nomination[];
    
    @OneToMany(() => Vote, vote => vote.beatmapset)
    votesReceived!: Vote[];

    public getInfo = function(this: Beatmapset, chosen = false): BeatmapsetInfo {
        return {
            id: this.ID,
            artist: this.artist,
            title: this.title,
            hoster: this.creator.osu.username,
            chosen,
        };
    }
}
