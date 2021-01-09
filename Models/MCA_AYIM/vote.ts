import { Entity, BaseEntity, PrimaryGeneratedColumn, ManyToOne, Column } from "typeorm";
import { User } from "../user";
import { Beatmapset } from "../beatmapset";
import { Category } from "./category";

@Entity()
export class Vote extends BaseEntity {
    
    @PrimaryGeneratedColumn()
    ID!: number;

    @ManyToOne(type => User, user => user.votes, {
        nullable: false,
    })
    voter!: User;
    
    @ManyToOne(type => Category, category => category.votes, {
        nullable: false,
    })
    category!: Category;

    @Column({ nullable: true })
    userID?: number;

    @ManyToOne(type => User, user => user.votesReceived)
    user?: User;

    @Column({ nullable: true })
    beatmapsetID?: number;

    @ManyToOne(type => Beatmapset, Beatmapset => Beatmapset.votesReceived)
    beatmapset?: Beatmapset;

    @Column()
    choice!: number;
    
}
