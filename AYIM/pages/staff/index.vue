<template>
    <div
        v-if="mca"
        class="staff-page"
    >
        <div class="staff-page__title">
            MCA - {{ mca.year }}
        </div>

        <nuxt-link
            to="/staff/comments"
            class="staff-page__link"
        >
            Comments pending >
        </nuxt-link>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { Action, State } from "vuex-class";

import { MCA } from "../../../Interfaces/mca";

@Component
export default class Staff extends Vue {

    @State mca!: MCA | null;
    @State year!: number;
    @Action updateYear;

    async mounted () {
        await this.updateYear(this.year);
    }

}
</script>
