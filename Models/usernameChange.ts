
import { Entity, Column, BaseEntity, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, OneToOne, JoinColumn, JoinTable, ManyToOne } from "typeorm";
import { User } from "./user";

@Entity()
export class UsernameChange extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    name!: string;

    @ManyToOne(type => User, user => user.otherNames)
    user!: User;

}