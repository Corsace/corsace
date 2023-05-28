import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from "../user";
import { ModeDivision } from "./modeDivision";

@Entity()
export class UserComment extends BaseEntity {
    
    @PrimaryGeneratedColumn()
        ID!: number;

    @Column("text")
        comment!: string;

    @Column({ type: "year" })
        year!: number;

    @Column({ default: false })
        isValid!: boolean;

    @ManyToOne(() => ModeDivision, modeDivision => modeDivision.userComments, {
        nullable: false,
        eager: true,
    })
        mode!: ModeDivision;
    
    @Column()
        commenterID!: number;

    @ManyToOne(() => User, user => user.commentsMade, { nullable: false })
        commenter!: User;

    @Column()
        targetID!: number;

    @ManyToOne(() => User, user => user.commentsReceived, { nullable: false })
        target!: User;

    @ManyToOne(() => User, user => user.commentReviews)
        reviewer?: User;

    @Column({ nullable: true })
        lastReviewedAt?: Date;

    @CreateDateColumn()
        createdAt!: Date;

    @UpdateDateColumn()
        updatedAt!: Date;

}
