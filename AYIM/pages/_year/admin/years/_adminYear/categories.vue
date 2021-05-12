<template>
    <div>
        <mode-switcher :hide-phase="true">
            <admin-categories />
        </mode-switcher>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

import ModeSwitcher from "../../../../../../MCA-AYIM/components/ModeSwitcher.vue";
import AdminCategories from "../../../../../../MCA-AYIM/components/admin/AdminCategories.vue";

@Component({
    components: {
        ModeSwitcher,
        AdminCategories,
    },
    head () {
        return {
            title: "Admin - Categories | AYIM",
        };
    },
})
export default class Years extends Vue {
    
}
</script>
