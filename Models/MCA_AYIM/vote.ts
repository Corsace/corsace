import { Entity, BaseEntity, PrimaryGeneratedColumn, ManyToOne, Column, SelectQueryBuilder } from "typeorm";
import { User } from "../user";
import { Beatmapset } from "../beatmapset";
import { Category } from "./category";

@Entity()
export class Vote extends BaseEntity {
    
    @PrimaryGeneratedColumn()
    ID!: number;

    @ManyToOne(() => User, user => user.votes, {
        nullable: false,
    })
    voter!: User;
    
    @ManyToOne(() => Category, category => category.votes, {
        nullable: false,
    })
    category!: Category;

    @Column({ nullable: true })
    userID?: number;

    @ManyToOne(() => User, user => user.votesReceived)
    user?: User;

    @Column({ nullable: true })
    beatmapsetID?: number;

    @ManyToOne(() => Beatmapset, Beatmapset => Beatmapset.votesReceived)
    beatmapset?: Beatmapset;

    @Column()
    choice!: number;

    static populate (): SelectQueryBuilder<Vote> {
        return this
            .createQueryBuilder("vote")
            .leftJoinAndSelect("vote.category", "category")
            .leftJoinAndSelect("vote.beatmapset", "beatmapset")
            .leftJoinAndSelect("vote.user", "user")
            .leftJoinAndSelect("vote.voter", "voter");
    }
    
}
