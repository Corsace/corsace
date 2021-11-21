import { Entity, Column, BaseEntity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { User } from "../user";

@Entity()
export class DemeritReport extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;
    
    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    reportDate!: Date;

    @Column({ type: "longtext", nullable: true })
    reason?: string;

    @Column({ default: 0 })
    amount!: number;

    @ManyToOne(() => User, user => user.demerits)
    user!: User;

    public getInfo = function(this: DemeritReport): DemeritInfo {
        const info: DemeritInfo = {
            date: this.reportDate,
            user: this.user.osu.username,
            reason: this.reason,
            amount: this.amount,
        };
        return info;
    }
}

export class DemeritInfo {
    date!: Date;
    user!: string;
    reason?: string;
    amount!: number;
}
