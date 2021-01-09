import { Entity, BaseEntity, Column, OneToMany, PrimaryColumn } from "typeorm";
import { UserComment } from "./userComments";
import { Beatmap } from "../beatmap";
import { GuestRequest } from "./guestRequest";
import { Category } from "./category";

@Entity()
export class ModeDivision extends BaseEntity {

    @PrimaryColumn()
    ID!: number;

    @Column()
    name!: string;

    @OneToMany(type => GuestRequest, guestRequest => guestRequest.mode)
    guestRequests!: GuestRequest[];

    @OneToMany(type => UserComment, userComment => userComment.mode)
    userComments!: UserComment[];

    @OneToMany(type => Beatmap, beatmap => beatmap.mode)
    beatmaps!: Beatmap[];
    
    @OneToMany(type => Category, category => category.mode)
    categories!: Category[];

}

export enum ModeDivisionType {
    standard = 1,
    taiko,
    fruits,
    mania,
    storyboard,
}
