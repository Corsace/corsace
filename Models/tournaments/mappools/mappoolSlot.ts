import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Mappool } from "./mappool";
import { MappoolMap } from "./mappoolMap";
import { User } from "../../user";

@Entity()
export class MappoolSlot extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @CreateDateColumn()
        createdAt!: Date;

    @ManyToOne(() => User, user => user.mappoolSlotsCreated, {
        nullable: false,
    })
        createdBy!: User;

    @ManyToOne(() => Mappool, mappool => mappool.slots, {
        nullable: false,
    })
        mappool!: Mappool;

    @Column()
        name!: string;

    @Column()
        acronym!: string;

    @Column({ nullable: true })
        colour?: string;

    @Column("int", { nullable: true })
        allowedMods?: number | null;

    @Column("int", { nullable: true })
        userModCount?: number | null;

    @Column("int", { nullable: true })
        uniqueModCount?: number | null;

    @OneToMany(() => MappoolMap, poolMap => poolMap.slot)
        maps!: MappoolMap[];

}