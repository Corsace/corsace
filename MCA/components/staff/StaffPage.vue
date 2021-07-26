<template>
    <div class="staff-page">
        <mode-switcher
            hide-phase
            :title="pageType"
        >
            <div class="staff-main">
                <div class="staff-filters">
                    <slot name="filter" />
                </div>
                <div class="staff-container staff-searchContainer">
                    <div class="staff-container staff-scrollTrack">
                        <slot />
                    </div>
                    <scroll-bar
                        selector=".staff-scrollTrack"
                    />
                </div>
            </div>
        </mode-switcher>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";

import ModeSwitcher from "../../../MCA-AYIM/components/ModeSwitcher.vue";
import ScrollBar from "../../../MCA-AYIM/components/ScrollBar.vue";

@Component({
    components: {
        ModeSwitcher,
        ScrollBar,
    },
})
export default class StaffPage extends Vue {
    @Prop({ type: String, required: true }) pageType!: string;
}
</script>
