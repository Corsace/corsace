import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { StageInfo } from "../../Interfaces/stage";
import { Match } from "./match";

@Entity()
export class Stage extends BaseEntity {
    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    name!: string;

    @OneToMany(() => Match, match => match.stage)
    matches!: Match[];

    public getInfo = async function(this: Stage): Promise<StageInfo> {
        return {
            ID: this.ID,
            name: this.name,
            matches: await Promise.all(this.matches.map(async (match) => await match.getInfo())),
        };
    };
    
}