import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, CreateDateColumn } from "typeorm";
import { MappoolMap } from "./mappoolMap";
import { User } from "../../user";

@Entity()
export class JobPost extends BaseEntity {
    
    @PrimaryGeneratedColumn()
    ID!: number;

    @CreateDateColumn()
    createdAt!: Date;
    
    @ManyToOne(() => User, user => user.jobPostsCreated)
    createdBy!: User;

    @Column()
    description!: string;

    @OneToOne(() => MappoolMap, map => map.jobPost)
    map!: MappoolMap;

    @Column({ nullable: true })
    jobBoardThread?: string;

}