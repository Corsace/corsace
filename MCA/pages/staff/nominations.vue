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
                        @click.prevent="selectCategory(category.id)"
                    >
                        {{ category.name }}
                    </a>

                    <template v-if="category.id === selectedCategoryId">
                        <div
                            v-for="userNominations in selectedCategoryInfo"
                            :key="userNominations.nominator.ID + '-nominator'"
                            class="staff-nomination-container"
                        >
                            <a
                                :href="`https://osu.ppy.sh/users/${userNominations.nominator.osu.userID}`"
                                target="_blank"
                                class="staff-page__link"
                            >
                                {{ userNominations.nominator.osu.username }}
                            </a>

                            <ul>
                                <li
                                    v-for="nomination in userNominations.nominations"
                                    :key="nomination.ID + '-nomination'"
                                >
                                    <div class="staff-nomination">
                                        <div class="staff-nomination__info">
                                            <a
                                                class="staff-page__link"
                                                :href="generateUrl(nomination)"
                                                target="_blank"
                                            >
                                                {{ getNomineeName(nomination) }}
                                            </a>
                                            <span
                                                class="staff-nomination__status"
                                                :class="`staff-nomination__status--${nomination.isValid ? 'valid' : 'invalid'}`"
                                            >
                                                {{ nomination.isValid ? 'valid' : 'invalid' }}
                                            </span>
                                            <div v-if="nomination.reviewer">
                                                Last reviewed by:
                                                {{ nomination.reviewer.osu.username }}
                                                at {{ new Date(nomination.lastReviewedAt).toDateString() }}
                                            </div>
                                        </div>

                                        <div class="staff-nomination__actions">
                                            <button
                                                class="button button--small staff-nomination__action"
                                                @click="updateNomination(nomination.ID, true)"
                                            >
                                                accept
                                            </button>
                                            <button
                                                class="button button--small staff-nomination__action"
                                                @click="updateNomination(nomination.ID, false)"
                                            >
                                                reject
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </template>
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

    get relatedCategories (): CategoryInfo[] {
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

    generateUrl (nomination: Nomination): string {
        if (nomination.beatmapset) {
            return `https://osu.ppy.sh/beatmapsets/${nomination.beatmapset.ID}`;
        }
        
        return `https://osu.ppy.sh/users/${nomination.user?.osu.userID}`;
    }

    getNomineeName (nomination: Nomination) {
        if (nomination.beatmapset) {
            return `${nomination.beatmapset.artist} - ${nomination.beatmapset.title}`;
        }

        return `${nomination.user?.osu.username}`;
    }

    updateLocalNomination (id: number, isValid) {
        const i = this.nominations.findIndex(n => n.ID === id);
        if (i !== -1) this.nominations[i].isValid = isValid;
    }

    async updateNomination (id: number, isValid) {
        const { data } = await axios.post(`/api/staff/nominations/${id}/update`, {
            isValid,
        });

        if (!data.error) {
            this.updateLocalNomination(id, isValid);
        }
    }

}
</script>

<style lang="scss">
@use '@s-sass/_partials';
@import '@s-sass/_variables';

.staff-nomination {
    &-container {
        display: flex;
        flex-direction: column;
        margin-bottom: 10px;
        border-bottom: 1px solid white;
    }
    
    display: flex;
    align-items: center;
    justify-content: space-between;

    &__status {
        margin-left: 5px;

        &--valid {
            color: $green;
        }

        &--invalid {
            color: $red;
        }
    }

    &__actions {
        display: flex;
    }

    &__action {
        margin: 5px;
    }
}

</style>
