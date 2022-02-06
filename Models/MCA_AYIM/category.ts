import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { ModeDivision } from "./modeDivision";
import { Nomination } from "./nomination";
import { Vote } from "./vote";
import { MCA } from "./mca";
import { CategoryCondensedInfo, CategoryInfo, CategoryType } from "../../Interfaces/category";

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

    @Column({ default: false })
    topOnly?: boolean;

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
    maxNominations!: number;

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
            maxNominations: this.maxNominations,
            type: CategoryType[this.type],
            mode: this.mode.name,
            isFiltered: this.filter && (this.filter.minLength || this.filter.maxLength || this.filter.minBPM || this.filter.maxBPM || this.filter.minSR || this.filter.maxSR || this.filter.minCS || this.filter.maxCS || this.filter.topOnly) ? true : false,
            filter: this.filter ?? undefined, 
        };
    }

    public getCondensedInfo = function(this: Category): CategoryCondensedInfo {
        return {
            name: this.name,
            type: CategoryType[this.type],
            mode: this.mode.name,
        };
    }

    public setFilter = function(this: Category, params?: CategoryFilter): void {
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
        filter.topOnly = params.topOnly ?? undefined;
        filter.rookie = params.rookie ?? undefined;
        this.filter = filter;
    }
}

export class CategoryGenerator {
    /**
     * Creates a grand award.
     */
    public createGrandAward = function(mca: MCA, mode: ModeDivision, type: CategoryType, isStoryboard = false): Category {
        const category = new Category;
        
        category.name = "grandAward";
        category.maxNominations = 3;
        category.type = type;
        category.mode = mode;
        category.mca = mca;

        if (isStoryboard)
            category.name = category.type === CategoryType.Beatmapsets ? "grandStoryboard" : "grandStoryboarder";

        return category;
    }

    /**
     * Creates a regular award.
     */
    public createOrUpdate = function(categoryInfo: Category, filter: CategoryFilter, category?: Category): Category {
        if (!category) {
            category = new Category;
        }
        
        category.name = categoryInfo.name;
        category.maxNominations = categoryInfo.maxNominations || 3;
        category.type = categoryInfo.type;
        category.mode = categoryInfo.mode;
        category.mca = categoryInfo.mca;
        category.setFilter(filter);

        return category;
    }
}
