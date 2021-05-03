<template>
    <display-layout
        :include-subnav="false"
        @scroll-bottom="getMappers(false)"
    >
        <template #sub-nav>
            <div class="ayim-comments__filter">
                <search-bar
                    placeholder="search for a mapper"
                    @update:search="updateQuery($event)"
                >

                    <toggle-button
                        :options="userOptions"
                        @change="changeOption"
                    />
                    
                    <toggle-button
                        :options="orderOptions"
                        @change="changeOrder"
                    />

                </search-bar>
            </div>
            <div
                v-if="info"
                class="info"
            >
                {{ $t('ayim.comments.info') }}
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
            
            <a
                :href="`https://osu.ppy.sh/users/${mapper.osu.userID}`" 
                class="ayim-user__username ayim-text ayim-text--xl"
            >
                {{ mapper.osu.username }}
            </a>
            
            <div class="ayim-user__links">
                <nuxt-link
                    :to="`/${mca.year}/comments/${mapper.ID}`"
                    class="button button--small"
                >
                    {{ $t('ayim.comments.viewSubmit') }}
                </nuxt-link>
            </div>
        </div>
    </display-layout>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";

import DisplayLayout from "../../../components/DisplayLayout.vue";
import ToggleButton from "../../../../MCA-AYIM/components/ToggleButton.vue";
import SearchBar from "../../../../MCA-AYIM/components/SearchBar.vue";
import { State } from "vuex-class";
import { User } from "../../../../Interfaces/user";
import { MCA } from "../../../../Interfaces/mca";

@Component({
    components: {
        DisplayLayout,
        SearchBar,
        ToggleButton
    },
    head () {
        return {
            title: "Users' Comments | AYIM",
        };
    },
})
export default class Comments extends Vue {

    @State mca!: MCA;
    @State selectedMode!: string;

    text = "";
    userOption = "id";
    orderOption = "asc";
    mappers: User[] = [];
    userOptions = ["id", "alph"];
    orderOptions = ["asc", "desc"];
    
    get info (): string {
        if (new Date() < this.mca.results) {
            return `All comments become public after MCA results date! You can submit your own comments now`;
        }

        return "";
    }

    @Watch("selectedMode")
    async onSelectedModeChanged () {
        await this.getMappers();
    }
    
    async mounted () {
        await this.getMappers();
    }

    async updateQuery (query: string) {
        this.text = query;
        await this.getMappers();
    }

    async changeOption (option: string) {
        this.userOption = option;
        await this.getMappers();
    }

    async changeOrder (order: string) {
        this.orderOption = order;
        await this.getMappers();
    }

    async getMappers (replace: boolean = true) {
        const { data } = await this.$axios.get(`/api/mappers/search?skip=${replace ? 0 : this.mappers.length}&year=${this.mca.year}&mode=${this.selectedMode}&option=${this.userOption}&order=${this.orderOption.toUpperCase()}&text=${this.text}`);

        if (data.error)
            alert(data.error);
        else if (replace)
            this.mappers = data;
        else
            this.mappers.push(...data);
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

.ayim-comments__filter {
    display: flex;
    width: 100%;
}
</style>
