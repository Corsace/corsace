import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MappoolMap } from "./mappoolMap";
import { Beatmap } from "../../beatmap";
import { User } from "../../user";

@Entity()
export class MappoolMapHistory extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @CreateDateColumn()
        createdAt!: Date;

    @ManyToOne(() => User, user => user.mappoolMapHistoryEntriesCreated)
        createdBy!: User;

    @ManyToOne(() => MappoolMap, mappoolMap => mappoolMap.history)
        mappoolMap!: MappoolMap;

    @ManyToOne(() => Beatmap, beatmap => beatmap.mappoolMapHistoryEntries)
        beatmap?: Beatmap;

    // For custom mapping
    @Column({ nullable: true })
        artist?: string;

    @Column({ nullable: true })
        title?: string;

    @Column({ nullable: true })
        difficulty?: string;

    @Column({ nullable: true })
        link?: string;
}