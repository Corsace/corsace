<template>
    <display-layout
        :include-subnav="false"
        @scroll-bottom="skipSearch"
    >
        <template #sub-nav>
            <search-bar
                placeholder="search for a mapper"
                @update:search="updateQuery($event)"
            />
            
            <div
                v-if="info"
                class="info"
            >
                {{ info }}
            </div>
        </template>

        <div
            v-for="mapper in mappers"
            :key="mapper.ID"
            class="ayim-user"
        >
            <img
                :src="`https://a.ppy.sh/${mapper.osu.userID}`"
                class="ayim-user__avatar"
            >
            
            <div class="ayim-user__username ayim-text ayim-text--xl">
                {{ mapper.osu.username }}
            </div>
            
            <div class="ayim-user__links">
                <nuxt-link
                    :to="`/${mca.year}/comments/${mapper.ID}`"
                    class="button button--small"
                >
                    view/submit comments
                </nuxt-link>
            </div>
        </div>
    </display-layout>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import axios from "axios";

import DisplayLayout from "../../../components/DisplayLayout.vue";
import SearchBar from "../../../../MCA-AYIM/components/SearchBar.vue";
import { State } from "vuex-class";
import { User } from "../../../../Interfaces/user";
import { MCA } from "../../../../Interfaces/mca";

@Component({
    components: {
        DisplayLayout,
        SearchBar,
    },
})
export default class Comments extends Vue {

    @State mca!: MCA;
    @State selectedMode!: string;

    skip = 0;
    text = "";
    mappers: User[] = [];
    
    get info (): string {
        if (new Date() < this.mca.results) {
            return `All comments become public after MCA results date! You can submit your own comments now`;
        }

        return "";
    }

    @Watch("selectedMode")
    async onSelectedModeChanged () {
        this.skip = 0;
        await this.getMappers();
    }
    
    async mounted () {
        this.getMappers();
    }

    async updateQuery (query) {
        this.text = query;
        await this.getMappers();
    }

    async skipSearch () {
        this.skip = this.mappers.length;
        await this.getMappers();
    }

    async getMappers () {
        const { data } = await axios.get(`/api/mappers/search?skip=${this.skip}&year=${this.mca.year}&mode=${this.selectedMode}&text=${this.text}`);

        if (data.error) {
            alert(data.error);
        } else if (this.skip === 0) {
            this.mappers = data;
        } else {
            this.mappers.push(...data);
        }
    }

}
</script>

<style lang="scss">
@import '@s-sass/_variables';
@import '@s-sass/_mixins';
@import '@s-sass/_partials';

.ayim-user {
    @extend %ayim-record;
    align-items: center;

    &__avatar {
        width: 100px;
        height: 100px;
        border-radius: 100%;
        box-shadow: $gray-shadow;
        margin-top: 15px;
        margin-bottom: 15px;
    }

    &__links {
        margin-top: 15px;

        & > a {
            margin-bottom: 10px;
            background-color: $gray-dark;
        }
    }
}
</style>
