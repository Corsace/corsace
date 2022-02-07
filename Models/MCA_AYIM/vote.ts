import { Entity, BaseEntity, PrimaryGeneratedColumn, ManyToOne, Column } from "typeorm";
import { User } from "../user";
import { Beatmapset } from "../beatmapset";
import { Category } from "./category";
import { Beatmap } from "../beatmap";

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

    @ManyToOne(() => Beatmap, Beatmap => Beatmap.votesReceived, {
        eager: true,
    })
    beatmap?: Beatmap;

    @Column()
    choice!: number;
}
