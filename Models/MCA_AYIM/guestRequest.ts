import { Entity, Column, BaseEntity, ManyToOne, PrimaryColumn, OneToOne, JoinTable, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user";
import { Beatmap } from "../beatmap";
import { ModeDivision } from "./modeDivision";

@Entity()
export class GuestRequest extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column({ type: "year" })
    year!: number;

    @ManyToOne(type => ModeDivision, modeDivision => modeDivision.guestRequests, {
        nullable: false,
        eager: true,
    })
    mode!: ModeDivision;

    @Column()
    accepted!: RequestStatus;

    @OneToOne(type => User, user => user.guestRequest, {
        nullable: false,
    })
    user!: User;

    @ManyToOne(type => Beatmap, beatmap => beatmap.guestRequests, {
        eager: true,
    })
    @JoinTable()
    beatmap!: Beatmap;

}

export enum RequestStatus {
    Pending,
    Accepted,
    Rejected
}
