import { Entity, Column, BaseEntity, ManyToOne, JoinTable, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user";
import { Beatmap } from "../beatmap";
import { ModeDivision } from "./modeDivision";
import { RequestStatus } from "../../Interfaces/requests";
import { MCA } from "./mca";

@Entity()
export class GuestRequest extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @ManyToOne(() => MCA, {
        nullable: false,
        eager: true,
    })
    mca!: MCA;

    @ManyToOne(() => ModeDivision, modeDivision => modeDivision.guestRequests, {
        nullable: false,
        eager: true,
    })
    mode!: ModeDivision;

    @Column({ type: "enum", enum: RequestStatus, default: RequestStatus.Pending })
    status!: RequestStatus;

    @ManyToOne(() => User, user => user.guestRequests, {
        nullable: false,
    })
    user!: User;

    @ManyToOne(() => Beatmap, beatmap => beatmap.guestRequests, {
        nullable: false,
        eager: true,
    })
    @JoinTable()
    beatmap!: Beatmap;

}
