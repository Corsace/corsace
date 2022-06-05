<template>
    <div
        v-if="mca"
        class="admin"
    >
        <div class="admin__title">
            MCA - {{ mca.name }}
        </div>

        <nuxt-link
            :to="`/${mca.name}/staff/requests`"
            class="admin__button admin__button--fit admin__link button"
        >
            Requests pending
        </nuxt-link>

        <nuxt-link
            :to="`/${mca.name}/staff/nominations`"
            class="admin__button admin__button--fit admin__link button"
        >
            Nominations review
        </nuxt-link>

        <nuxt-link
            :to="`/${mca.name}/staff/votes`"
            class="admin__button admin__button--fit admin__link button"
        >
            Vote Lists
        </nuxt-link>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace } from "vuex-class";

import { MCAInfo } from "../../../../Interfaces/mca";
import { CategoryInfo } from "../../../../Interfaces/category";
import { GuestRequest } from "../../../../Interfaces/guestRequests";

const staffModule = namespace("staff");

@Component({
    head () {
        return {
            title: "Staff | MCA",
        };
    },
})
export default class Staff extends Vue {

    @staffModule.State mca!: MCAInfo | null;
    @staffModule.State categories!: CategoryInfo[];
    @staffModule.State requests!: GuestRequest[];

}
</script>
