<template>
    <div>
        <mode-switcher :hide-phase="true">
            <admin-page />
        </mode-switcher>
    </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

import AdminPage from "../components/admin/AdminPage.vue";
import ModeSwitcher from "../../MCA-AYIM/components/ModeSwitcher.vue";

@Component({
    components: {
        ModeSwitcher,
        AdminPage,
    },
})
export default class Admin extends Vue {
    
}
</script>
