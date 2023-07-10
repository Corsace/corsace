import { BaseEntity, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user";
import { Team } from "./team";

@Entity()
export class TeamInvite extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @CreateDateColumn()
        createdAt!: Date;

    @ManyToOne(() => User, user => user.teamInvites)
        user!: User;

    @ManyToOne(() => Team, team => team.invites)
        team!: Team;

}