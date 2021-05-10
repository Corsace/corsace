<template>
    <div>
        <mode-switcher :hide-phase="true">
            <admin-years />
        </mode-switcher>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

import ModeSwitcher from "../../../../../MCA-AYIM/components/ModeSwitcher.vue";
import AdminYears from "../../../../../MCA-AYIM/components/admin/AdminYears.vue";

@Component({
    components: {
        ModeSwitcher,
        AdminYears,
    },
    head () {
        return {
            title: "Admin | MCA",
        };
    },
})
export default class Years extends Vue {
    
}
</script>
