import { BaseEntity, Brackets, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Round } from "../round";
import { Stage } from "../stage";
import { Tournament } from "../tournament";
import { MappoolSlot } from "./mappoolSlot";

@Entity()
export class Mappool extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

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

    static search (tournament: Tournament, poolText: string = "", getRelations: boolean = false) {
        const q = this.createQueryBuilder("mappool")
        if (getRelations) {
            q.leftJoinAndSelect("mappool.stage", "stage")
            q.leftJoinAndSelect("mappool.round", "round")
        } else {
            q.leftJoin("mappool.stage", "stage")
            q.leftJoin("mappool.round", "round")
        }
        return q
            .where("stage.tournament = :tournament")
            .andWhere(new Brackets(qb => {
                qb.where("stage.name LIKE :criteria")
                    .orWhere("round.name LIKE :criteria")
                    .orWhere("stage.abbreviation LIKE :criteria")
                    .orWhere("round.abbreviation LIKE :criteria");
            }))
            .setParameters({
                tournament: tournament.ID,
                criteria: `%${poolText}%`,
            })
            .getMany();
    }

}