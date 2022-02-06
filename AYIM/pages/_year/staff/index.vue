<template>
    <div
        v-if="mca"
        class="staff-page"
    >
        <div class="staff-page__title">
            AYIM - {{ mca.name }}
        </div>

        <nuxt-link
            :to="`/${mca.name}/staff/comments`"
            class="staff-page__link"
        >
            Comments pending >
        </nuxt-link>

        <nuxt-link
            :to="`/${mca.name}/staff/influences`"
            class="staff-page__link"
        >
            Influence Comments pending >
        </nuxt-link>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace } from "vuex-class";

import { MCAInfo } from "../../../../Interfaces/mca";

const staffModule = namespace("staff");

@Component({
    head () {
        return {
            title: "Staff | AYIM",
        };
    },
})
export default class Staff extends Vue {

    @staffModule.State mca!: MCAInfo | null;

}
</script>
