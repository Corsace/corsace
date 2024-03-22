import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../user";
import { MappoolMap } from "./mappoolMap";

@Entity()
export class MappoolReplay extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @CreateDateColumn()
        createdAt!: Date;
    
    @ManyToOne(() => User, user => user.mappoolReplaysCreated, {
        nullable: false,
    })
        createdBy!: User;

    @Column()
        link!: string;

    @Column()
        score!: number;

    @OneToOne(() => MappoolMap, mappoolMap => mappoolMap.replay)
        mappoolMap?: MappoolMap;
}