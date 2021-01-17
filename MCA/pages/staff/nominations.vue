<template>
    <div class="staff-page">
        <div
            v-for="category in categories"
            :key="category.id"
        >
            <a
                href="#"
                @click="selectCategory"
            >
                {{ category.name }}
            </a>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace } from "vuex-class";

import { CategoryInfo } from "../../../Interfaces/category";
import { GuestRequest } from "../../../Interfaces/guestRequests";

const staffModule = namespace("staff");

@Component
export default class Nominations extends Vue {
    
    @staffModule.State categories!: CategoryInfo[];
    @staffModule.State requests!: GuestRequest[];

    selectCategory () {
        console.log("selected");
    }

}
</script>
