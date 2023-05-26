import { Entity, Column, BaseEntity, ManyToOne, JoinTable, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user";
import { Beatmap } from "../beatmap";
import { ModeDivision } from "./modeDivision";
import { RequestStatus } from "../../Interfaces/guestRequests";
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

// Check if text is posessive for guest difficulty checks (TODO: osu! now tracks guest difficulties, should replace this with a check using that instead later)
export function isPossessive (text: string) {
    const lowerText = text.toLowerCase();
    return lowerText.includes("'s") || lowerText.includes("s'");
}