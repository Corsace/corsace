import { Entity, Column, BaseEntity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { User } from "./user";

@Entity()
export class Badge extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    description!: string;

    @Column()
    imageName!: string;

    @ManyToOne(() => User, user => user.badges)
    user!: User;

}