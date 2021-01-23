<template>
    <div
        v-if="mca"
        class="staff-page"
    >
        <div class="staff-page__title">
            MCA - {{ mca.name }}
        </div>

        <nuxt-link
            v-if="requests.length"
            :to="`/${mca.name}/staff/requests`"
            class="staff-page__link"
        >
            Requests pending >
        </nuxt-link>

        <nuxt-link
            v-if="categories.length"
            :to="`/${mca.name}/staff/nominations`"
            class="staff-page__link"
        >
            Nominations review >
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

@Component
export default class Staff extends Vue {

    @staffModule.State mca!: MCAInfo | null;
    @staffModule.State categories!: CategoryInfo[];
    @staffModule.State requests!: GuestRequest[];

}
</script>
