<template>
    <div class="staff-page">
        <mode-switcher
            :hide-phase="true"
            title="nominations"
        >
            <div class="staff-container">
                <div
                    v-for="category in relatedCategories"
                    :key="category.id + '-category'"
                    class="staff-container__box"
                >
                    <a
                        class="staff-container__title"
                        href="#"
                        @click="selectCategory(category.id)"
                    >
                        {{ category.name }}
                    </a>

                    <div
                        v-for="userNominations in selectedCategoryInfo"
                        :key="userNominations.nominator.ID + '-nominator'"
                    >
                        {{ userNominations.nominator.osu.username }}

                        <div
                            v-for="nomination in userNominations.nominations"
                            :key="nomination.ID + '-nomination'"
                        >
                            {{ nomination.isValid ? 'valid' : 'invalid' }}
                        </div>
                    </div>
                </div>
            </div>
        </mode-switcher>
    </div>
</template>

<script lang="ts">
import axios from "axios";
import { Vue, Component } from "vue-property-decorator";
import { namespace, State } from "vuex-class";

import ModeSwitcher from "../../../MCA-AYIM/components/ModeSwitcher.vue";

import { Category, CategoryInfo } from "../../../Interfaces/category";
import { Nomination } from "../../../Interfaces/nomination";
import { User } from "../../../Interfaces/user";

const staffModule = namespace("staff");

interface UserNomination {
    nominator: User,
    nominations: Nomination[]
}

interface NominationsByCategory {
    category: Category;
    userNominations: UserNomination[];
}

@Component({
    components: {
        ModeSwitcher,
    },
})
export default class Nominations extends Vue {
    
    @State selectedMode!: string;
    @staffModule.State categories!: CategoryInfo[];

    nominations: Nomination[] = [];
    selectedCategoryId: null | number = null;

    get relatedCategories () {
        return this.categories.filter(c => c.mode === this.selectedMode);
    }

    get nominationsByCategory (): NominationsByCategory[] {
        const groups: NominationsByCategory[] = [];

        for (const nomination of this.nominations) {
            const groupIndex = groups.findIndex(g => g.category.ID === nomination.category.ID);

            if (groupIndex !== -1) {
                const nominatorIndex = groups[groupIndex].userNominations.findIndex(n => n.nominator.ID === nomination.nominator.ID);

                if (nominatorIndex !== -1) {
                    groups[groupIndex].userNominations[nominatorIndex].nominations.push(nomination);
                } else {
                    groups[groupIndex].userNominations.push({
                        nominator: nomination.nominator,
                        nominations: [nomination],
                    });
                }
            } else {
                groups.push({
                    category: nomination.category,
                    userNominations: [{
                        nominator: nomination.nominator,
                        nominations: [nomination],
                    }],
                });
            }
        }

        return groups;
    }

    get selectedCategoryInfo (): UserNomination[] {
        const group = this.nominationsByCategory.find(group => group.category.ID === this.selectedCategoryId);
        return group?.userNominations || [];
    }

    async selectCategory (id: number) {
        const { data } = await axios.get(`/api/staff/nominations?category=${id}`);

        if (data.error) {
            alert(data.error);
            return;
        }

        this.nominations = data;
        this.selectedCategoryId = id;
    }

}
</script>
