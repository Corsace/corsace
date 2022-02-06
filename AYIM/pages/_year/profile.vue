<template>
    <mode-switcher
        v-if="mca"
        hide-phase
        tablet
        stretch
        :ignore-modes="['storyboard']"
    >
        <div class="profile-page">
            <div class="profile-container">
                <p>Influences: You can have a maximum of 5 users listed.</p>
                <p>Add them in order of importance</p>
            </div>
            <div class="profile-container profile-container--row">
                <div class="influence-list">
                    <div
                        v-for="influence in influences"
                        :key="influence.ID"
                    >
                        <div
                            class="influence-list__item"
                        >
                            {{ influence.rank }} - 
                            {{ influence.influence.osu.username }}

                            <button 
                                class="button button__remove button--small"
                                @click="remove(influence.ID)"
                            >
                                remove
                            </button>
                        </div>

                        <p>{{ influence.comment }}</p>
                    </div>
                </div>

                <div class="influence-list">
                    <div
                        v-for="influence in lastAvailableInfluences"
                        :key="influence.ID"
                        class="influence-list__item"
                    >
                        {{ influence.rank }} - 
                        {{ influence.influence.osu.username }}

                        <button
                            class="button button__add button--small"
                            @click="add(influence.influence.ID)"
                        >
                            add
                        </button>
                    </div>
                </div>
            </div>

            <template v-if="influences.length < 5">
                <search-bar
                    :placeholder="$t('ayim.comments.search')"
                    @update:search="search($event)"
                />

                <div
                    v-if="users.length"
                    class="profile-container"
                >
                    <textarea
                        v-model="comment"
                        class="textarea"
                        placeholder="Comment on the user you want to add"
                    />

                    <ul>
                        <li
                            v-for="user in users"
                            :key="user.ID"
                            class="influence-list__item"
                        >
                            <a
                                :href="`https://osu.ppy.sh/users/${user.osu.userID}`"
                                target="_blank"
                            >
                                {{ user.osu.username }}
                            </a>

                            <button
                                v-if="!influences.some(i => i.influence.ID === user.ID)"
                                class="button button__add button--small"
                                @click="add(user.ID)"
                            >
                                add
                            </button>
                        </li>
                    </ul>
                </div>
            </template>
        </div>
    </mode-switcher>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State } from "vuex-class";
import ModeSwitcher from "../../../MCA-AYIM/components/ModeSwitcher.vue";
import InfluenceTreeLeaf from "../../components/InfluenceTreeLeaf.vue";
import SearchBar from "../../../MCA-AYIM/components/SearchBar.vue";
import { User, UserMCAInfo } from "../../../Interfaces/user";
import { Influence } from "../../../Interfaces/influence";
import { MCA } from "../../../Interfaces/mca";

@Component({
    components: {
        ModeSwitcher,
        InfluenceTreeLeaf,
        SearchBar,
    },
})
export default class Comments extends Vue {

    @State loggedInUser!: UserMCAInfo;
    @State selectedMode!: string;
    @State mca!: MCA;

    lastInfluences: Influence[] = [];
    influences: Influence[] = [];

    async getInfluences (year: number): Promise<Influence[]> {
        const influences = await this.getLastestInfluences(year);
        return influences.filter(i => i.year === this.mca.year);
    }

    async getLastestInfluences (maxYear: number): Promise<Influence[]> {
        try {
            const {data} = await this.$axios.get(`/api/influences?user=${this.loggedInUser.osu.userID}&mode=${this.selectedMode}&year=${maxYear}`);

            if (!data.error) {
                return data.influences;
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.log(error);
        }

        return [];
    }
    
    async mounted () {
        if (!this.mca) {
            alert("No MCA yet");
            return this.$router.go(-1);
        }

        this.lastInfluences = await this.getLastestInfluences(this.mca.year - 1);
        this.influences = await this.getInfluences(this.mca.year);
    }

    get lastAvailableInfluences () {
        return this.lastInfluences.filter(li => 
            !this.influences.some(i => i.influence.ID === li.influence.ID)
        );
    }

    async remove (id: number) {
        try {
            const {data} = await this.$axios.delete(`/api/influences/${id}`);
        
            if (data.success) {
                this.influences = await this.getInfluences(this.mca.year);
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.log(error);
        }
    }
    
    users: User[] = [];
    comment = "";

    async search (userSearch) {
        try {
            const {data} = await this.$axios.get(`/api/users/search?user=${userSearch}`);

            if (!data.error) {
                this.users = data;
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.log(error);
        }
    }

    async add (id: number) {
        try {
            const {data} = await this.$axios.post(`/api/influences/create`, {
                year: this.mca.year,
                target: id,
                mode: this.selectedMode,
                comment: this.comment,
            });
        
            if (!data.error) {
                this.influences.push(data);
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.log(error);
        }
    }

}
</script>

<style lang="scss">
.profile-page {
    display: flex;
    flex-flow: column;
}

.profile-container {
    background-color: rgba(0, 0, 0, .65);
    box-shadow: 0 0 8px rgb(0 0 0 / 63%);
    padding: 5px 20px;
    margin: 5px;
    border-radius: 5.5px;

    display: flex;
    flex-direction: column;

    &--row {
        flex-direction: row;
        justify-content: space-between;
    }
}

.influence-list__item {
    display: flex;
    align-items: center;
    gap: 10px;
}
</style>
