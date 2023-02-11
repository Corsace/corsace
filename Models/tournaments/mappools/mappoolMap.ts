import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Beatmap } from "../../beatmap";
import { MappoolMapHistory } from "./mappoolMapHistory";
import { MappoolSlot } from "./mappoolSlot";

@Entity()
export class MappoolMap extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @CreateDateColumn()
    createdAt!: Date;
    
    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    lastUpdate!: Date;

    @Column({ default: false })
    isCustom!: boolean;

    @Column({ nullable: true })
    link?: string;

    @ManyToOne(() => MappoolSlot, slot => slot.maps)
    slot!: MappoolSlot;

    @ManyToOne(() => Beatmap, beatmap => beatmap.mappoolMaps)
    beatmap!: Beatmap;

    @OneToMany(() => MappoolMapHistory, history => history.mappoolMap)
    history!: MappoolMapHistory[];

}