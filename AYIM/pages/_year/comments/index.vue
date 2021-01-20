<template>
    <display-layout
        nav-title="mapsets"
        :include-subnav="false"
    >
        <template #sub-nav>
            <search-bar
                placeholder="search for a mapper"
                @update:search="updateQuery($event)"
            />
        </template>

        <div
            v-for="i in 20"
            :key="i"
            class="ayim-user"
        >
            <img
                :src="`https://a.ppy.sh/${6203841}`"
                class="ayim-user__avatar"
            >
            
            <div class="ayim-user__username ayim-text ayim-text--xl">
                kagetsu
            </div>
            
            <div class="ayim-user__links">
                <nuxt-link
                    :to="`/2020/comments/kagetsu`"
                    class="button button--small"
                >
                    view comments
                </nuxt-link>
                <nuxt-link
                    :to="`/2020/comments/submit/kagetsu`"
                    class="button button--small"
                >
                    submit/edit
                </nuxt-link>
            </div>
        </div>
    </display-layout>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

import DisplayLayout from "../../../components/DisplayLayout.vue";
import SearchBar from "../../../../MCA-AYIM/components/SearchBar.vue";

@Component({
    components: {
        DisplayLayout,
        SearchBar,
    },
})
export default class Comments extends Vue {

    updateQuery (query) {
        console.log(query);
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
