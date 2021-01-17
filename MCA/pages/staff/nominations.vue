<template>
    <div class="staff-page">
        <div class="staff-page__title">
            Nominations
        </div>

        <div class="staff-requests">
            <div
                v-for="category in categories"
                :key="category.id + '-category'"
                class="staff-requests__item"
            >
                <a
                    class="staff-requests__mode"
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
    </div>
</template>

<script lang="ts">
import axios from "axios";
import { Vue, Component } from "vue-property-decorator";
import { namespace } from "vuex-class";

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

@Component
export default class Nominations extends Vue {
    
    @staffModule.State categories!: CategoryInfo[];

    nominations: Nomination[] = [];
    selectedCategoryId: null | number = null;

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
