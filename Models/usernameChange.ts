import { Entity, Column, BaseEntity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { User } from "./user";

@Entity()
export class UsernameChange extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @Column()
        name!: string;

    @ManyToOne(() => User, user => user.otherNames)
        user!: User;

}