import { BaseEntity, Brackets, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Round } from "../round";
import { Stage } from "../stage";
import { Tournament } from "../tournament";
import { MappoolSlot } from "./mappoolSlot";
import { User } from "../../user";

@Entity()
export class Mappool extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @ManyToOne(() => User, user => user.mappoolsCreated)
    createdBy!: User;

    @Column()
    name!: string;

    @Column()
    abbreviation!: string;

    @Column({ default: false })
    isPublic!: boolean;

    @Column({ type: "text", nullable: true })
    mappackLink?: string | null;

    @Column({ type: "datetime", nullable: true })
    mappackExpiry?: Date | null;

    @Column()
    targetSR!: number;

    @Column()
    order!: number;

    @ManyToOne(() => Stage, stage => stage.mappool)
    stage!: Stage;

    @ManyToOne(() => Round, round => round.mappool)
    round?: Round;

    @OneToMany(() => MappoolSlot, mappoolSlot => mappoolSlot.mappool)
    slots!: MappoolSlot[];

    static search (tournament: Tournament, poolText: string = "", getStageRound: boolean = false, getSlots: boolean = false, getMaps: boolean = false) {
        const q = this.createQueryBuilder("mappool")
        if (getStageRound) {
            q.leftJoinAndSelect("mappool.stage", "stage")
            q.leftJoinAndSelect("mappool.round", "round")
        } else
            q.leftJoin("mappool.stage", "stage")

        if (getSlots) {
            q.leftJoinAndSelect("mappool.slots", "slot")
            q.leftJoinAndSelect("slot.maps", "mappoolMap")
            if (getMaps) {
                q.leftJoinAndSelect("mappoolMap.customBeatmap", "customBeatmap")
                q.leftJoinAndSelect("mappoolMap.customMappers", "customMapper")
                q.leftJoinAndSelect("mappoolMap.testplayers", "testplayer")
                q.leftJoinAndSelect("mappoolMap.jobPost", "jobPost")
                q.leftJoinAndSelect("mappoolMap.beatmap", "beatmap")
                q.leftJoinAndSelect("beatmap.beatmapset", "beatmapset")
            }
        }
        return q
            .where("stage.tournament = :tournament")
            .andWhere(new Brackets(qb => {
                qb.where("mappool.name LIKE :criteria")
                    .orWhere("mappool.abbreviation LIKE :criteria");
            }))
            .setParameters({
                tournament: tournament.ID,
                criteria: `%${poolText}%`,
            })
            .getMany();
    }

}