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
        eager: true,
    })
    category!: Category;

    @ManyToOne(() => User, user => user.votesReceived, {
        eager: true,
    })
    user?: User;

    @ManyToOne(() => Beatmapset, Beatmapset => Beatmapset.votesReceived, {
        eager: true,
    })
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
