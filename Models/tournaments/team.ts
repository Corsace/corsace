import { Entity, BaseEntity, PrimaryColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { User } from "../user";
import { Qualifier } from  "./qualifier";

@Entity()
export class Team extends BaseEntity {
    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    name!: string;

    @Column()
    captain!: number;

    @Column("double", { nullable: true })
    averagePp!: number;

    @Column()
    teamAvatarUrl!: string;
    
    @Column()
    slug!: string;

    @Column("double", { nullable: true})
    averageBWS?: number;

    @Column({ nullable: true})
    seed!: "A" | "B" | "C" | "D" | null;

    @Column()
    rank!: number; 

    @ManyToMany(() => User, user => user.team, {
        nullable: false,
    })
    members!: User[];

    @ManyToOne(() => Qualifier, qualifierLobby => qualifierLobby.teams, {
        nullable: true, 
    })
    qualifier!: Qualifier | null
}