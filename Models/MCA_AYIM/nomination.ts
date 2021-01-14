import { Entity, BaseEntity, PrimaryGeneratedColumn, ManyToOne, Column } from "typeorm";
import { User } from "../user";
import { Beatmapset } from "../beatmapset";
import { Category } from "./category";

@Entity()
export class Nomination extends BaseEntity {
    
    @PrimaryGeneratedColumn()
    ID!: number;

    @ManyToOne(() => User, user => user.nominations, {
        nullable: false,
    })
    nominator!: User;
    
    @ManyToOne(() => Category, category => category.nominations, {
        nullable: false,
        eager: true,
    })
    category!: Category;

    @ManyToOne(() => User, user => user.nominationsReceived, {
        eager: true,
    })
    user?: User;

    @ManyToOne(() => Beatmapset, Beatmapset => Beatmapset.nominationsReceived, {
        eager: true,
    })
    beatmapset?: Beatmapset;

    @Column({ default: false })
    isValid!: boolean;
    
    @ManyToOne(() => User, user => user.nominationReviews)
    reviewer!: User;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    lastReviewedAt!: Date;
}
