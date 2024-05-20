import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Round } from "../round";
import { Stage } from "../stage";
import { MappoolSlot } from "./mappoolSlot";
import { User } from "../../user";

@Entity()
export class Mappool extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @CreateDateColumn()
        createdAt!: Date;

    @ManyToOne(() => User, user => user.mappoolsCreated, {
        nullable: false,
    })
        createdBy!: User;

    @Column()
        name!: string;

    @Column()
        abbreviation!: string;

    @Column({ default: false })
        isPublic!: boolean;

    @Column({ default: false })
        bannable!: boolean;

    @Column({ type: "text", nullable: true })
        mappackLink?: string | null;

    @Column({ type: "datetime", nullable: true })
        mappackExpiry?: Date | null;

    @Column()
        targetSR!: number;

    @Column()
        order!: number;

    @ManyToOne(() => Stage, stage => stage.mappool, {
        nullable: false,
    })
        stage!: Stage;

    @ManyToOne(() => Round, round => round.mappool)
        round?: Round;

    @OneToMany(() => MappoolSlot, mappoolSlot => mappoolSlot.mappool)
        slots!: MappoolSlot[];

}