import { Entity, BaseEntity, Column, OneToMany, PrimaryColumn } from "typeorm";
import { UserComment } from "./userComments";
import { Beatmap } from "../beatmap";
import { GuestRequest } from "./guestRequest";
import { Category } from "./category";
import { Influence } from "./influence";

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
    
    @OneToMany(() => Category, category => category.mode)
    categories!: Category[];

}

export enum ModeDivisionType {
    standard = 1,
    taiko,
    fruits,
    mania,
    storyboard,
}
