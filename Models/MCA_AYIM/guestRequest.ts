import { Entity, Column, BaseEntity, ManyToOne, OneToOne, JoinTable, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user";
import { Beatmap } from "../beatmap";
import { ModeDivision } from "./modeDivision";
import { RequestStatus } from "../../Interfaces/guestRequests";

@Entity()
export class GuestRequest extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column({ type: "year" })
    year!: number;

    @ManyToOne(() => ModeDivision, modeDivision => modeDivision.guestRequests, {
        nullable: false,
        eager: true,
    })
    mode!: ModeDivision;

    @Column({ type: "enum", enum: RequestStatus, default: RequestStatus.Pending })
    accepted!: RequestStatus

    @OneToOne(() => User, user => user.guestRequest, {
        nullable: false,
    })
    user!: User;

    @ManyToOne(() => Beatmap, beatmap => beatmap.guestRequests, {
        eager: true,
    })
    @JoinTable()
    beatmap!: Beatmap;

}
