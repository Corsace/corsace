import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { ModeDivision } from "./modeDivision";
import { Nomination } from "./nomination";
import { Vote } from "./vote";
import { MCA } from "./mca";
import { CategoryInfo, CategoryType } from "../../Interfaces/category";

export class CategoryFilter {

    @Column({ nullable: true })
    minLength?: number;

    @Column({ nullable: true })
    maxLength?: number;

    @Column({ nullable: true })
    minBPM?: number;

    @Column({ nullable: true })
    maxBPM?: number;

    @Column({ nullable: true })
    minSR?: number;

    @Column({ nullable: true })
    maxSR?: number;

    @Column({ nullable: true })
    minCS?: number;

    @Column({ nullable: true })
    maxCS?: number;

    @Column({ nullable: true })
    rookie?: boolean;

}

@Entity()
export class Category extends BaseEntity {
    
    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    name!: string;

    @Column()
    description!: string;
    
    @Column()
    maxNominations!: number;
    
    @Column({ default: false })
    isRequired!: boolean;

    @Column({ default: false })
    requiresVetting!: boolean;

    @Column(() => CategoryFilter)
    filter?: CategoryFilter;

    @Column({ type: "enum", enum: CategoryType, default: CategoryType.Beatmapsets })
    type!: CategoryType;
    
    @ManyToOne(() => ModeDivision, modeDivision => modeDivision.categories, {
        nullable: false,
        eager: true,
    })
    mode!: ModeDivision;

    @ManyToOne(() => MCA, mca => mca.categories, {
        nullable: false,
        eager: true,
    })
    mca!: MCA;

    @OneToMany(() => Nomination, nomination => nomination.category)
    nominations!: Nomination[];
    
    @OneToMany(() => Vote, vote => vote.category)
    votes!: Vote[];

    public getInfo = function(this: Category): CategoryInfo {
        return {
            id: this.ID,
            name: this.name,
            description: this.description,
            maxNominations: this.maxNominations,
            isRequired: this.isRequired,
            requiresVetting: this.requiresVetting,
            type: CategoryType[this.type],
            mode: this.mode.name,
            isFiltered: this.filter && (this.filter.minLength || this.filter.maxLength || this.filter.minBPM || this.filter.maxBPM || this.filter.minSR || this.filter.maxSR || this.filter.minCS || this.filter.maxCS) ? true : false,
            filter: this.filter ?? undefined, 
        };
    }

    public addFilter = function(this: Category, params?: CategoryFilter): void {
        if (!params)
            return;

        const filter = new CategoryFilter;
        filter.minLength = params.minLength ?? undefined;
        filter.maxLength = params.maxLength ?? undefined;
        filter.minBPM = params.minBPM ?? undefined;
        filter.maxBPM = params.maxBPM ?? undefined;
        filter.minSR = params.minSR ?? undefined;
        filter.maxSR = params.maxSR ?? undefined;
        filter.minCS = params.minCS ?? undefined;
        filter.maxCS = params.maxCS ?? undefined;
        filter.rookie = params.rookie ?? undefined;
        this.filter = filter;
    }
}

export class CategoryGenerator {
    /**
     * Creates a grand award.
     */
    public createGrandAward = function(mca: MCA, mode: ModeDivision, type: CategoryType): Category {
        const category = new Category;
        
        category.name = "Grand Award";
        category.description = "The best of the best.";
        category.maxNominations = 1;
        category.isRequired = true;
        category.type = type;
        category.mode = mode;
        category.mca = mca;

        return category;
    }

    /**
     * Creates a regular award.
     */
    public create = function(name: string, description: string, type: CategoryType, mca: MCA, mode: ModeDivision): Category {
        const category = new Category;
        
        category.name = name;
        category.description = description;
        category.maxNominations = 3;
        category.isRequired = false;
        category.type = type;
        category.mode = mode;
        category.mca = mca;

        return category;
    }
}
