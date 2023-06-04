import { Entity, BaseEntity, Column, OneToMany, PrimaryColumn } from "typeorm";
import { UserComment } from "./userComments";
import { Beatmap } from "../beatmap";
import { GuestRequest } from "./guestRequest";
import { Category } from "./category";
import { Influence } from "./influence";
import { Tournament } from "../tournaments/tournament";
import { CustomBeatmap } from "../tournaments/mappools/customBeatmap";

@Entity()
export class ModeDivision extends BaseEntity {

    @PrimaryColumn()
        ID!: number;

    @Column()
        name!: string;

    @OneToMany(() => GuestRequest, guestRequest => guestRequest.mode)
        guestRequests!: GuestRequest[];

    @OneToMany(() => UserComment, userComment => userComment.mode)
        userComments!: UserComment[];

    @OneToMany(() => Influence, influence => influence.mode)
        influences!: Influence[];

    @OneToMany(() => Beatmap, beatmap => beatmap.mode)
        beatmaps!: Beatmap[];

    @OneToMany(() => CustomBeatmap, customBeatmap => customBeatmap.mode)
        customBeatmaps!: CustomBeatmap[];
    
    @OneToMany(() => Category, category => category.mode)
        categories!: Category[];

    @OneToMany(() => Tournament, tournament => tournament.mode)
        tournaments!: Tournament[];

    static modeSelect (modeText: string): Promise<ModeDivision | null> {
        switch (modeText) {
            case "standard" || "std": {
                return ModeDivision.findOne({ where: { ID: 1 }});
            } case "taiko" || "tko": {
                return ModeDivision.findOne({ where: { ID: 2 }});
            } case "catch" || "ctb": {
                return ModeDivision.findOne({ where: { ID: 3 }});
            } case "mania" || "man": {
                return ModeDivision.findOne({ where: { ID: 4 }});
            } case "storyboard" || "sb": {
                return ModeDivision.findOne({ where: { ID: 5 }});
            } default: {
                return Promise.resolve(null);
            }
        }
    }

}

export enum ModeDivisionType {
    standard = 1,
    taiko,
    fruits,
    mania,
    storyboard,
}

export const modeTextHash = {
    "0": 1, 
    "standard": 1,
    "osu": 1,
    "osu!": 1,
    "osu!standard": 1,
    "osu!std": 1,
    "std": 1,

    "1": 2,
    "taiko": 2,
    "osu!taiko": 2,
    "osu!tko": 2,
    "tko": 2,

    "2": 3,
    "fruits": 3,
    "catch": 3,
    "catch the beat": 3,
    "osu!catch": 3,
    "osu!fruits": 3,
    "osu!ctb": 3,
    "ctb": 3,

    "3": 4,
    "mania": 4,
    "osu!mania": 4,
    "osu!man": 4,
    "man": 4,
};

export function modeTextToID (mode: string | null | undefined): number {
    if (!mode)
        return 0;
    return modeTextHash[mode.trim().toLowerCase()] || 0;
}
