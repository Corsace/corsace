import { BaseEntity, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { GroupInfo } from "../../Interfaces/group";
import { Mappool } from "./mappool";
import { Match } from "./match";
import { Tournament } from "./tournament";

@Entity()
export class Group extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @ManyToOne(() => Tournament, tournament => tournament.groups)
    tournament!: Tournament;

    @ManyToOne(() => Mappool, mappool => mappool.groups)
    mappool!: Mappool;

    @OneToMany(() => Match, match => match.group)
    matches!: Match[];

    public getInfo = async function (this: Group) : Promise<GroupInfo> {
        const info: GroupInfo = { 
            ID: this.ID,
            tournament: await this.tournament.getInfo(),
            mappool: await this.mappool.getInfo(),
            matches: await Promise.all(this.matches.map((match) => match.getInfo())),
        };
        return info;
    }


}