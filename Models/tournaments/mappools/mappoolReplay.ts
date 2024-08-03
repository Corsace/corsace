import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../user";
import { MappoolMap } from "./mappoolMap";

@Entity()
export class MappoolReplay extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @CreateDateColumn()
        createdAt!: Date;
    
    @ManyToOne(() => User, user => user.mappoolReplaysCreated, {
        nullable: false,
    })
        createdBy!: User;

    @Column()
        link!: string;

    @Column({ length: 32, nullable: true })
        replayMD5?: string;

    @Column({ length: 32, nullable: true })
        beatmapMD5?: string;

    @Column()
        score!: number;

    @Column()
        maxCombo!: number;

    @Column()
        perfect!: boolean;

    @Column()
        count300!: number;

    @Column()
        count100!: number;

    @Column()
        count50!: number;

    @Column()
        countGeki!: number;

    @Column()
        countKatu!: number;

    @Column()
        misses!: number;

    @OneToOne(() => MappoolMap, mappoolMap => mappoolMap.replay)
        mappoolMap?: MappoolMap;

    public accuracyDecimal () {
        const total = this.count300 + this.count100 + this.count50 + this.misses;
        const acc = (this.count300 * 6 + this.count100 * 2 + this.count50) / (total * 6);
        return acc;
    }

    public accuracyPercentage () {
        return `${(this.accuracyDecimal() * 100).toFixed(2)}%`;
    }
}